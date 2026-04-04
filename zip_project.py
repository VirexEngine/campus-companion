import os
import zipfile

def zip_project(src_dir, output_filename):
    # Directories and files to exclude
    exclude_dirs = {'node_modules', '.git', 'venv', '__pycache__', '.pytest_cache'}
    exclude_exts = {'.zip', '.lock', '.lockb'}
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(src_dir):
            # Exclude directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                # Exclude specific files or extensions
                if file.endswith(tuple(exclude_exts)) or file == 'zip_project.py':
                    continue
                    
                file_path = os.path.join(root, file)
                # Ensure the path inside the zip is relative
                arcname = os.path.relpath(file_path, src_dir)
                zipf.write(file_path, arcname)

if __name__ == '__main__':
    src = r'c:\Users\Administrator\Pictures\campus-companion-main'
    out = os.path.join(src, 'campus-companion-export.zip')
    zip_project(src, out)
    print(f"Created {out} successfully.")
