import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from logic.file_scanner import FileScanner
from translator.translator import Translator

def test_scanner():
    print("Testing FileScanner...")
    # Create some dummy files
    os.makedirs("test_dir/subdir", exist_ok=True)
    with open("test_dir/file1.txt", "w") as f: f.write("content")
    with open("test_dir/subdir/file2.py", "w") as f: f.write("content")
    
    scanner = FileScanner("test_dir")
    files = scanner.scan()
    print(f"Found files: {files}")
    
    assert "file1.txt" in files
    assert os.path.join("subdir", "file2.py") in files
    print("Scanner test passed!")

def test_translator():
    print("\nTesting Translator (this might take a while to download model)...")
    translator = Translator()
    
    korean_text = "안녕하세요. 이것은 테스트입니다."
    english_text = translator.translate(korean_text)
    
    print(f"Input: {korean_text}")
    print(f"Output: {english_text}")
    
    assert len(english_text) > 0
    print("Translator test passed!")

if __name__ == "__main__":
    try:
        test_scanner()
        test_translator()
        print("\nAll logic tests passed!")
    except Exception as e:
        print(f"\nTest failed: {e}")
        import traceback
        traceback.print_exc()
