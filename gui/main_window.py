import os
import yaml
import json
from PyQt6.QtWidgets import (
    QMainWindow, QFileDialog, QMessageBox, QMenu, QMenuBar
)
from PyQt6.QtGui import QAction
from gui.chat_widget import ChatWidget
from logic.file_scanner import FileScanner
from translator.translator import Translator

CONFIG_FILE = "config.json"

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Draft Builder")
        self.resize(800, 600)
        
        self.root_dir = self.load_config()
        self.file_scanner = FileScanner(self.root_dir)
        self.translator = Translator() # Lazy loads model
        
        self.init_ui()

        if not self.root_dir:
            self.select_directory()

    def init_ui(self):
        # Menu Bar
        menubar = self.menuBar()
        file_menu = menubar.addMenu("File")
        
        select_dir_action = QAction("Select Reference Directory", self)
        select_dir_action.triggered.connect(self.select_directory)
        file_menu.addAction(select_dir_action)
        
        # Central Widget
        self.chat_widget = ChatWidget(self.file_scanner)
        self.chat_widget.phase_completed.connect(self.on_draft_complete)
        self.setCentralWidget(self.chat_widget)

    def load_config(self):
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r") as f:
                    data = json.load(f)
                    return data.get("root_dir", "")
            except:
                pass
        return ""

    def save_config(self, path):
        with open(CONFIG_FILE, "w") as f:
            json.dump({"root_dir": path}, f)

    def select_directory(self):
        dir_path = QFileDialog.getExistingDirectory(self, "Select Reference Directory")
        if dir_path:
            self.root_dir = dir_path
            self.save_config(dir_path)
            self.file_scanner.root_dir = dir_path
            self.chat_widget.append_system_message(f"Reference directory set to: {dir_path}")

    def on_draft_complete(self, status, data):
        if status == "DONE":
            self.process_and_save(data)

    def process_and_save(self, data):
        self.chat_widget.append_system_message("Translating to English... (This may take a moment)")
        # Force UI update
        from PyQt6.QtWidgets import QApplication
        QApplication.processEvents()

        try:
            # Translate content
            translated_data = {
                "goal": self.translator.translate(data["Goal"]),
                "context": self.translator.translate_list(data["Context"]),
                "steps": self.translator.translate_list(data["Steps"]),
                "constraints": self.translator.translate_list(data["Constraints"])
            }
            
            # Save to file
            save_path, _ = QFileDialog.getSaveFileName(self, "Save Draft File", "", "Draft Files (*.draft);;All Files (*)")
            if save_path:
                with open(save_path, "w", encoding="utf-8") as f:
                    yaml.dump(translated_data, f, allow_unicode=True, sort_keys=False)
                
                self.chat_widget.append_system_message(f"Draft saved successfully to: {save_path}")
                QMessageBox.information(self, "Success", "Draft saved successfully!")
            else:
                self.chat_widget.append_system_message("Save cancelled.")
                
        except Exception as e:
            self.chat_widget.append_system_message(f"Error: {str(e)}")
            QMessageBox.critical(self, "Error", f"Failed to save draft: {str(e)}")
