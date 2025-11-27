import os
import yaml
import json
from datetime import datetime
from PyQt6.QtWidgets import (
    QMainWindow, QFileDialog, QMessageBox, QMenu, QMenuBar, QToolBar, QWidget, QLabel, QHBoxLayout,
    QDialog, QVBoxLayout, QPushButton, QLineEdit
)
from PyQt6.QtGui import QAction, QIcon
from PyQt6.QtCore import QSize, Qt, QThread, pyqtSignal
from gui.chat_widget import ChatWidget
from logic.file_scanner import FileScanner
from translator.translator import Translator

CONFIG_FILE = ".config/config.json"

class TranslationWorker(QThread):
    """Worker thread for async translation"""
    finished = pyqtSignal(dict)  # Emits translated data
    error = pyqtSignal(str)  # Emits error message

    def __init__(self, translator, data):
        super().__init__()
        self.translator = translator
        self.data = data

    def run(self):
        try:
            # Translate without adding newlines to individual items
            goal = self.translator.translate(self.data["목표"])
            context = [self.translator.translate(item) for item in self.data["컨텍스트"]]
            steps = [self.translator.translate(item) for item in self.data["단계"]]
            constraints = [self.translator.translate(item) for item in self.data["제약사항"]]

            translated_data = {
                "goal": goal,
                "context": context,
                "steps": steps,
                "constraints": constraints
            }
            self.finished.emit(translated_data)
        except Exception as e:
            self.error.emit(str(e))

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Draft Generator")
        self.resize(1200, 800)

        self.root_dir = self.load_config()
        self.file_scanner = FileScanner(self.root_dir)
        self.translator = Translator() # Lazy loads model

        self.apply_modern_style()
        self.init_ui()

    def apply_modern_style(self):
        """Apply modern, Gemini-inspired styling"""
        self.setStyleSheet("""
            QMainWindow {
                background-color: #1a1a1a;
            }
            QMenuBar {
                background-color: transparent;
                color: #e8eaed;
                border: none;
                padding: 2px 6px;
                font-size: 14px;
                font-family: 'Google Sans', 'SF Pro Display', 'Segoe UI', Arial, sans-serif;
            }
            QMenuBar::item {
                background-color: transparent;
                padding: 5px 9px;
                border-radius: 8px;
                margin: 0 2px;
            }
            QMenuBar::item:selected {
                background-color: rgba(138, 180, 248, 0.15);
                color: #8ab4f8;
            }
            QMenu {
                background-color: #292a2d;
                color: #e8eaed;
                border: 1px solid #5f6368;
                border-radius: 12px;
                padding: 8px;
                font-family: 'Google Sans', 'SF Pro Display', 'Segoe UI', Arial, sans-serif;
            }
            QMenu::item {
                padding: 10px 24px;
                border-radius: 8px;
                margin: 2px 4px;
            }
            QMenu::item:selected {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #1967d2, stop:1 #4285f4);
                color: #ffffff;
            }
            QToolBar {
                background-color: #202124;
                border: none;
                border-bottom: 1px solid #3c4043;
                padding: 1px 8px;
                spacing: 4px;
            }
            QToolButton {
                background-color: transparent;
                border: none;
                border-radius: 10px;
                padding: 8px;
                color: #e8eaed;
                font-size: 20px;
                min-width: 20px;
                min-height: 20px;
            }
            QToolButton:hover {
                background-color: rgba(138, 180, 248, 0.15);
                color: #8ab4f8;
            }
            QToolButton:pressed {
                background-color: rgba(138, 180, 248, 0.25);
            }
            QMessageBox {
                background-color: #292a2d;
                color: #e8eaed;
            }
            QMessageBox QLabel {
                color: #e8eaed;
                font-size: 14px;
                qproperty-alignment: AlignCenter;
                padding: 20px;
            }
            QMessageBox QPushButton {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #1967d2, stop:1 #4285f4);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px 24px;
                font-size: 14px;
                font-weight: 600;
                min-width: 80px;
            }
            QMessageBox QPushButton:hover {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #1a73e8, stop:1 #5a9df4);
            }
        """)

    def init_ui(self):
        # Custom Toolbar with Gemini-style header
        toolbar = QToolBar()
        toolbar.setMovable(False)
        toolbar.setIconSize(QSize(24, 24))
        self.addToolBar(toolbar)

        # App title/logo on the left
        title_widget = QWidget()
        title_layout = QHBoxLayout(title_widget)
        title_layout.setContentsMargins(2, 0, 0, 0)
        title_layout.setSpacing(0)

        title_label = QLabel("Draft Generator")
        title_label.setStyleSheet("""
            QLabel {
                color: #e8eaed;
                font-size: 12px;
                font-weight: 600;
                font-family: 'Google Sans', 'SF Pro Display', 'Segoe UI', Arial, sans-serif;
                padding: 1px 4px;
            }
        """)
        title_layout.addWidget(title_label)
        toolbar.addWidget(title_widget)

        # Spacer to push buttons to the right
        spacer = QWidget()
        spacer.setSizePolicy(
            spacer.sizePolicy().Policy.Expanding,
            spacer.sizePolicy().Policy.Preferred
        )
        toolbar.addWidget(spacer)

        # Settings button with modern icon
        settings_action = QAction("⚙", self)
        settings_action.setToolTip("설정 (참조 디렉토리)")
        settings_action.triggered.connect(self.show_settings_dialog)
        toolbar.addAction(settings_action)

        # Menu Bar (optional, minimal)
        menubar = self.menuBar()
        file_menu = menubar.addMenu("파일")

        select_dir_action = QAction("참조 디렉토리 선택", self)
        select_dir_action.triggered.connect(self.show_settings_dialog)
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
        config_dir = os.path.dirname(CONFIG_FILE)
        if config_dir and not os.path.exists(config_dir):
            os.makedirs(config_dir)
        with open(CONFIG_FILE, "w") as f:
            json.dump({"root_dir": path}, f)

    def show_settings_dialog(self):
        """Show settings dialog popup"""
        dialog = QDialog(self)
        dialog.setWindowTitle("설정")
        dialog.setMinimumWidth(500)
        dialog.setStyleSheet("""
            QDialog {
                background-color: #202124;
                color: #e8eaed;
            }
            QLabel {
                color: #e8eaed;
                font-size: 14px;
                font-family: 'Google Sans', 'SF Pro Display', 'Segoe UI', Arial, sans-serif;
                padding: 8px 0;
            }
            QLineEdit {
                background-color: #303134;
                color: #e8eaed;
                border: 2px solid #3c4043;
                border-radius: 8px;
                padding: 10px 16px;
                font-size: 14px;
                font-family: 'Google Sans', 'SF Pro Display', 'Segoe UI', Arial, sans-serif;
            }
            QLineEdit:focus {
                border: 2px solid #8ab4f8;
            }
            QPushButton {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #1967d2, stop:1 #4285f4);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px 24px;
                font-size: 14px;
                font-weight: 600;
                font-family: 'Google Sans', 'SF Pro Display', 'Segoe UI', Arial, sans-serif;
            }
            QPushButton:hover {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #1a73e8, stop:1 #5a9df4);
            }
            QPushButton:pressed {
                background: #174ea6;
            }
            QPushButton#browseButton {
                background-color: #303134;
                color: #e8eaed;
                border: 1px solid #5f6368;
            }
            QPushButton#browseButton:hover {
                background-color: #3c4043;
            }
        """)

        layout = QVBoxLayout()
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)

        # Directory setting section
        dir_label = QLabel("참조 디렉토리")
        layout.addWidget(dir_label)

        dir_input_layout = QHBoxLayout()
        dir_input_layout.setSpacing(8)

        self.dir_input = QLineEdit()
        self.dir_input.setText(self.root_dir)
        self.dir_input.setReadOnly(True)
        dir_input_layout.addWidget(self.dir_input)

        browse_button = QPushButton("찾아보기")
        browse_button.setObjectName("browseButton")
        browse_button.clicked.connect(lambda: self.browse_directory(dialog))
        dir_input_layout.addWidget(browse_button)

        layout.addLayout(dir_input_layout)

        # Buttons
        button_layout = QHBoxLayout()
        button_layout.setSpacing(8)
        button_layout.addStretch()

        cancel_button = QPushButton("취소")
        cancel_button.clicked.connect(dialog.reject)
        button_layout.addWidget(cancel_button)

        save_button = QPushButton("저장")
        save_button.clicked.connect(lambda: self.save_settings(dialog))
        button_layout.addWidget(save_button)

        layout.addLayout(button_layout)

        dialog.setLayout(layout)
        dialog.exec()

    def browse_directory(self, dialog):
        """Browse for directory"""
        dir_path = QFileDialog.getExistingDirectory(dialog, "참조 디렉토리 선택", self.root_dir)
        if dir_path:
            self.dir_input.setText(dir_path)

    def save_settings(self, dialog):
        """Save settings from dialog"""
        dir_path = self.dir_input.text()
        if dir_path and os.path.isdir(dir_path):
            self.root_dir = dir_path
            self.save_config(dir_path)
            self.file_scanner.root_dir = dir_path
            self.chat_widget.append_system_message(f"참조 디렉토리가 설정되었습니다:<br/><code style='color: #8ab4f8;'>{dir_path}</code>")
            dialog.accept()
        else:
            QMessageBox.warning(dialog, "경고", "올바른 디렉토리를 선택해주세요.")

    def on_draft_complete(self, status, data):
        if status == "DONE":
            self.process_and_save(data)

    def process_and_save(self, data):
        # Show loading overlay
        self.chat_widget.show_loading("영어로 번역하는 중...", "잠시만 기다려주세요...")

        # Start async translation
        self.translation_worker = TranslationWorker(self.translator, data)
        self.translation_worker.finished.connect(self.on_translation_complete)
        self.translation_worker.error.connect(self.on_translation_error)
        self.translation_worker.start()

    def on_translation_complete(self, translated_data):
        """Called when translation is complete"""
        self.chat_widget.hide_loading()

        # Save to file
        default_filename = f"draft_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.draft"
        save_path, _ = QFileDialog.getSaveFileName(self, "문서 파일 저장", default_filename, "Draft 파일 (*.draft);;모든 파일 (*)")
        if save_path:
            try:
                with open(save_path, "w", encoding="utf-8") as f:
                    # Manually format YAML with newlines between sections
                    f.write(f"goal: {translated_data['goal']}\n\n")

                    f.write("context:\n")
                    for item in translated_data['context']:
                        f.write(f"- {item}\n")
                    f.write("\n")

                    f.write("steps:\n")
                    for item in translated_data['steps']:
                        f.write(f"- {item}\n")
                    f.write("\n")

                    f.write("constraints:\n")
                    for item in translated_data['constraints']:
                        f.write(f"- {item}\n")

                self.chat_widget.append_system_message(f"문서가 성공적으로 저장되었습니다!<br/><code style='color: #8ab4f8;'>{save_path}</code>")
                msg = QMessageBox(self)
                msg.setIcon(QMessageBox.Icon.NoIcon)
                msg.setWindowTitle("성공")
                msg.setText("문서가 성공적으로 저장되었습니다!")
                msg.setStandardButtons(QMessageBox.StandardButton.Ok)
                msg.exec()
            except Exception as e:
                self.chat_widget.append_system_message(f"오류가 발생했습니다:<br/><code style='color: #f28b82;'>{str(e)}</code>")
                QMessageBox.critical(self, "오류", f"문서 저장 실패: {str(e)}")
        else:
            self.chat_widget.append_system_message("저장이 취소되었습니다.")

    def on_translation_error(self, error_msg):
        """Called when translation encounters an error"""
        self.chat_widget.hide_loading()
        self.chat_widget.append_system_message(f"번역 중 오류가 발생했습니다:<br/><code style='color: #f28b82;'>{error_msg}</code>")
        QMessageBox.critical(self, "오류", f"번역 실패: {error_msg}")
