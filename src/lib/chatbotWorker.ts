import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = false;
// Explicitly redirect WASM to CDN to fix Vite bundling errors locally
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@onnxruntime/web@1.14.0/dist/';

class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;

  static async getInstance(progress_callback?: Function) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

let knowledgeChunks: string[] = [];
let knowledgeEmbeddings: any[] = [];

// Cosine similarity logic
function cos_sim(A: any[], B: any[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < A.length; i++) {
        dotProduct += A[i] * B[i];
        normA += A[i] * A[i];
        normB += B[i] * B[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

self.addEventListener('message', async (event) => {
  const { type, text } = event.data;

  if (type === 'init') {
    try {
      const rawLines = text.split('\n')
        .map((chunk: string) => chunk.trim())
        .filter((chunk: string) => chunk.length > 30);
        
      knowledgeChunks = [];
      const LINES_PER_CHUNK = 4;
      for (let i = 0; i < rawLines.length; i += LINES_PER_CHUNK) {
        knowledgeChunks.push(rawLines.slice(i, i + LINES_PER_CHUNK).join(' '));
      }
      
      const extractor = await PipelineSingleton.getInstance((x: any) => {
        self.postMessage(x); 
      });

      self.postMessage({ status: 'embedding_knowledge' });

      const BATCH_SIZE = 50; 
      for (let i = 0; i < knowledgeChunks.length; i += BATCH_SIZE) {
          const batch = knowledgeChunks.slice(i, i + BATCH_SIZE);
          const output = await extractor(batch, { pooling: 'mean', normalize: true });
          knowledgeEmbeddings.push(...output.tolist());
      }
      
      self.postMessage({ status: 'ready' });
    } catch (err: any) {
      console.error(err);
      self.postMessage({ status: 'error', message: err.message || String(err) });
    }
  }

  if (type === 'query') {
    try {
      const extractor = await PipelineSingleton.getInstance();
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      const queryEmbedding = output.tolist()[0];

      let bestMatch = '';
      let highestScore = -1;

      for (let i = 0; i < knowledgeEmbeddings.length; i++) {
        const score = cos_sim(queryEmbedding, knowledgeEmbeddings[i]);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = knowledgeChunks[i];
        }
      }

      if (highestScore > 0.45) {
        self.postMessage({ status: 'result', result: bestMatch });
      } else {
        self.postMessage({ status: 'result', result: "I couldn't find an exact answer to that in the college knowledge base. Try rephrasing your question." });
      }
    } catch (err: any) {
      console.error(err);
      self.postMessage({ status: 'error', message: err.message || String(err) });
    }
  }
});
