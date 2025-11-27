import os
from typing import List

class FileScanner:
    def __init__(self, root_dir: str):
        self.root_dir = root_dir

    def scan(self) -> List[str]:
        """
        Recursively scans the root directory and returns a list of relative file paths.
        Ignores hidden files/directories (starting with .).
        """
        file_list = []
        if not os.path.exists(self.root_dir):
            return []

        for root, dirs, files in os.walk(self.root_dir):
            # Modify dirs in-place to skip hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for file in files:
                if file.startswith('.'):
                    continue
                
                full_path = os.path.join(root, file)
                # Store relative path for display/search
                rel_path = os.path.relpath(full_path, self.root_dir)
                file_list.append(rel_path)
        
        return sorted(file_list)

    def get_absolute_path(self, rel_path: str) -> str:
        return os.path.join(self.root_dir, rel_path)
