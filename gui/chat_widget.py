from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTextEdit, QLineEdit, QListWidget,
    QLabel, QPushButton, QGraphicsOpacityEffect, QFrame
)
from PyQt6.QtCore import Qt, pyqtSignal, QEvent, QPropertyAnimation, QEasingCurve, QTimer
from PyQt6.QtGui import QKeyEvent, QPainter, QPen, QColor

class SpinnerWidget(QWidget):
    """Custom spinning loader widget"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.angle = 0
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.rotate)
        self.setFixedSize(60, 60)

    def rotate(self):
        self.angle = (self.angle + 10) % 360
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        # Draw the background circle
        pen = QPen(QColor("#3c4043"), 4)
        pen.setCapStyle(Qt.PenCapStyle.RoundCap)
        painter.setPen(pen)
        painter.drawArc(10, 10, 40, 40, 0, 360 * 16)

        # Draw the colored arc
        pen.setColor(QColor("#8ab4f8"))
        painter.setPen(pen)
        painter.drawArc(10, 10, 40, 40, self.angle * 16, 90 * 16)

    def start(self):
        self.timer.start(30)

    def stop(self):
        self.timer.stop()

class ChatWidget(QWidget):
    phase_completed = pyqtSignal(str, object) # phase_name, data

    def __init__(self, file_scanner):
        super().__init__()
        self.file_scanner = file_scanner
        self.phases = ["목표", "컨텍스트", "단계", "제약사항"]
        self.phase_korean_names = {
            "목표": "목표",
            "컨텍스트": "컨텍스트",
            "단계": "단계",
            "제약사항": "제약사항"
        }
        self.phase_english_names = {
            "목표": "goal",
            "컨텍스트": "context",
            "단계": "steps",
            "제약사항": "constraints"
        }
        self.current_phase_index = 0
        self.collected_data = {
            "목표": "",
            "컨텍스트": [],
            "단계": [],
            "제약사항": []
        }

        self.init_ui()

    def get_object_particle(self, word):
        """Get the correct object particle (을/를) for a Korean word"""
        # Check the last character's final consonant
        if not word:
            return "를"
        last_char = word[-1]
        # Get unicode value to check for final consonant (받침)
        char_code = ord(last_char)
        if 0xAC00 <= char_code <= 0xD7A3:  # Hangul syllable range
            final_consonant = (char_code - 0xAC00) % 28
            return "을" if final_consonant else "를"
        return "를"

    def init_ui(self):
        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Chat History with Gemini-inspired styling
        self.chat_history = QTextEdit()
        self.chat_history.setReadOnly(True)
        self.chat_history.setStyleSheet("""
            QTextEdit {
                background-color: #1a1a1a;
                color: #e8eaed;
                border: none;
                padding: 32px;
                font-size: 15px;
                line-height: 1.6;
                font-family: 'Google Sans', 'SF Pro Display', 'Segoe UI', Arial, sans-serif;
            }
            QScrollBar:vertical {
                background-color: #1f1f1f;
                width: 12px;
                border-radius: 6px;
            }
            QScrollBar::handle:vertical {
                background-color: #3c4043;
                border-radius: 6px;
                min-height: 30px;
            }
            QScrollBar::handle:vertical:hover {
                background-color: #5f6368;
            }
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
                height: 0px;
            }
        """)
        layout.addWidget(self.chat_history)

        # Phase indicator - sleek badge style with gradient
        self.phase_label = QLabel(f"현재 단계: {self.phase_korean_names[self.phases[0]]}")
        self.phase_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.phase_label.setStyleSheet("""
            QLabel {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #174ea6, stop:1 #1967d2);
                color: #ffffff;
                padding: 14px 28px;
                font-size: 13px;
                font-weight: 600;
                letter-spacing: 0.5px;
                border-top: 1px solid rgba(138, 180, 248, 0.3);
            }
        """)
        layout.addWidget(self.phase_label)

        # Input container for better styling control
        input_container = QWidget()
        input_container.setStyleSheet("""
            QWidget {
                background-color: #202124;
                border-top: 1px solid #3c4043;
            }
        """)
        input_layout = QHBoxLayout(input_container)
        input_layout.setContentsMargins(20, 16, 20, 16)
        input_layout.setSpacing(12)

        # Input Area with Gemini-style rounded design
        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText("메시지를 입력하세요... (Enter: 추가, Ctrl+Enter: 다음 단계, @: 파일)")
        self.input_field.setStyleSheet("""
            QLineEdit {
                background-color: #303134;
                color: #e8eaed;
                border: 2px solid transparent;
                border-radius: 24px;
                padding: 14px 24px;
                font-size: 15px;
                font-family: 'Google Sans', 'SF Pro Display', 'Segoe UI', Arial, sans-serif;
            }
            QLineEdit:focus {
                background-color: #353639;
                border: 2px solid #8ab4f8;
            }
            QLineEdit::placeholder {
                color: #9aa0a6;
            }
        """)
        self.input_field.installEventFilter(self)
        self.input_field.focusOutEvent = self.input_focus_out
        input_layout.addWidget(self.input_field)

        # Send button with icon
        self.send_button = QPushButton("▶")
        self.send_button.setFixedSize(48, 48)
        self.send_button.setCursor(Qt.CursorShape.PointingHandCursor)
        self.send_button.setToolTip("항목 추가 (Enter)")
        self.send_button.setStyleSheet("""
            QPushButton {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #1967d2, stop:1 #1a73e8);
                color: white;
                border: none;
                border-radius: 24px;
                font-size: 18px;
                font-weight: bold;
            }
            QPushButton:hover {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #1a73e8, stop:1 #4285f4);
            }
            QPushButton:pressed {
                background: #174ea6;
            }
        """)
        self.send_button.clicked.connect(self.add_item)
        input_layout.addWidget(self.send_button)

        # Next phase button
        self.next_button = QPushButton("⏎")
        self.next_button.setFixedSize(48, 48)
        self.next_button.setCursor(Qt.CursorShape.PointingHandCursor)
        self.next_button.setToolTip("다음 단계 (Ctrl+Enter)")
        self.next_button.setStyleSheet("""
            QPushButton {
                background-color: #303134;
                color: #e8eaed;
                border: 1px solid #5f6368;
                border-radius: 24px;
                font-size: 18px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #3c4043;
                border: 1px solid #8ab4f8;
            }
            QPushButton:pressed {
                background-color: #292a2d;
            }
            QPushButton:disabled {
                background-color: #202124;
                color: #5f6368;
                border: 1px solid #3c4043;
            }
        """)
        self.next_button.clicked.connect(self.next_phase)
        input_layout.addWidget(self.next_button)

        # Reset button
        self.reset_button = QPushButton("↻")
        self.reset_button.setFixedSize(48, 48)
        self.reset_button.setCursor(Qt.CursorShape.PointingHandCursor)
        self.reset_button.setToolTip("초기화")
        self.reset_button.setStyleSheet("""
            QPushButton {
                background-color: #303134;
                color: #e8eaed;
                border: 1px solid #5f6368;
                border-radius: 24px;
                font-size: 22px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #3c4043;
                border: 1px solid #f28b82;
                color: #f28b82;
            }
            QPushButton:pressed {
                background-color: #292a2d;
            }
        """)
        self.reset_button.clicked.connect(self.reset_chat)
        input_layout.addWidget(self.reset_button)

        layout.addWidget(input_container)
        
        # Autocomplete Popup with Gemini-style dropdown
        self.popup = QListWidget(self)
        self.popup.setWindowFlags(Qt.WindowType.ToolTip)
        self.popup.setStyleSheet("""
            QListWidget {
                background-color: #292a2d;
                color: #e8eaed;
                border: 1px solid #5f6368;
                border-radius: 12px;
                padding: 8px;
                font-size: 14px;
                font-family: 'Google Sans', 'SF Pro Display', 'Segoe UI', Arial, sans-serif;
            }
            QListWidget::item {
                padding: 12px 18px;
                border-radius: 8px;
                margin: 2px 0;
            }
            QListWidget::item:selected {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #1967d2, stop:1 #4285f4);
                color: #ffffff;
            }
            QListWidget::item:hover {
                background-color: #3c4043;
            }
            QScrollBar:vertical {
                background-color: #292a2d;
                width: 8px;
                border-radius: 4px;
            }
            QScrollBar::handle:vertical {
                background-color: #5f6368;
                border-radius: 4px;
            }
        """)
        self.popup.hide()
        self.popup.itemClicked.connect(self.insert_completion)

        self.setLayout(layout)

        # Loading overlay
        self.loading_overlay = QFrame(self)
        self.loading_overlay.setStyleSheet("""
            QFrame {
                background-color: rgba(0, 0, 0, 0.85);
            }
        """)
        self.loading_overlay.hide()

        overlay_layout = QVBoxLayout(self.loading_overlay)
        overlay_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        overlay_layout.setSpacing(24)

        # Loading spinner (정중앙)
        self.loading_spinner = SpinnerWidget(self.loading_overlay)
        overlay_layout.addWidget(self.loading_spinner, 0, Qt.AlignmentFlag.AlignCenter)

        self.loading_label = QLabel("번역 중입니다...")
        self.loading_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.loading_label.setStyleSheet("""
            QLabel {
                color: #ffffff;
                font-size: 24px;
                font-weight: 600;
                font-family: 'Google Sans', 'SF Pro Display', 'Segoe UI', Arial, sans-serif;
                background-color: transparent;
                padding: 0;
                margin: 0;
            }
        """)
        overlay_layout.addWidget(self.loading_label, 0, Qt.AlignmentFlag.AlignCenter)

        self.loading_subtext = QLabel("잠시만 기다려주세요...")
        self.loading_subtext.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.loading_subtext.setStyleSheet("""
            QLabel {
                color: #9aa0a6;
                font-size: 16px;
                font-family: 'Google Sans', 'SF Pro Display', 'Segoe UI', Arial, sans-serif;
                background-color: transparent;
                padding: 0;
                margin: 0;
            }
        """)
        overlay_layout.addWidget(self.loading_subtext, 0, Qt.AlignmentFlag.AlignCenter)

        phase_korean = self.phase_korean_names[self.phases[0]]
        phase_english = self.phase_english_names[self.phases[0]]
        self.append_system_message(f"안녕하세요!<br/><b>{phase_korean}({phase_english})</b>를 입력하여 시작하세요.")

    def eventFilter(self, obj, event):
        if obj == self.input_field and event.type() == QEvent.Type.KeyPress:
            key_event = event # type: QKeyEvent
            
            if self.popup.isVisible():
                if key_event.key() == Qt.Key.Key_Down:
                    self.popup.setCurrentRow(min(self.popup.currentRow() + 1, self.popup.count() - 1))
                    return True
                elif key_event.key() == Qt.Key.Key_Up:
                    self.popup.setCurrentRow(max(self.popup.currentRow() - 1, 0))
                    return True
                elif key_event.key() == Qt.Key.Key_Enter or key_event.key() == Qt.Key.Key_Return:
                    self.insert_completion(self.popup.currentItem())
                    return True
                elif key_event.key() == Qt.Key.Key_Escape:
                    self.popup.hide()
                    # Remove the @ from input if present
                    text = self.input_field.text()
                    if "@" in text:
                        last_at_index = text.rfind("@")
                        self.input_field.setText(text[:last_at_index])
                    return True

            if key_event.key() == Qt.Key.Key_At:
                # Delay showing popup to let the @ be typed
                pass 

            if key_event.modifiers() & Qt.KeyboardModifier.ControlModifier:
                if key_event.key() == Qt.Key.Key_Enter or key_event.key() == Qt.Key.Key_Return:
                    self.next_phase()
                    return True
            
            if key_event.key() == Qt.Key.Key_Enter or key_event.key() == Qt.Key.Key_Return:
                self.add_item()
                return True

        if obj == self.input_field and event.type() == QEvent.Type.KeyRelease:
            text = self.input_field.text()
            if "@" in text:
                last_at_index = text.rfind("@")
                query = text[last_at_index + 1:]
                self.show_popup(query)
            else:
                self.popup.hide()

        return super().eventFilter(obj, event)

    def show_popup(self, query):
        files = self.file_scanner.scan()
        filtered = [f for f in files if query.lower() in f.lower()]

        if not filtered:
            self.popup.hide()
            return

        # Save current row if popup is visible
        current_row = self.popup.currentRow() if self.popup.isVisible() else 0

        self.popup.clear()
        self.popup.addItems(filtered)

        # Restore selection or set to first item
        if current_row < len(filtered):
            self.popup.setCurrentRow(current_row)
        else:
            self.popup.setCurrentRow(0)

        # Position popup above input field
        pos = self.input_field.mapToGlobal(self.input_field.rect().topLeft())
        self.popup.move(pos.x(), pos.y() - self.popup.sizeHint().height())
        self.popup.resize(self.input_field.width(), 100)
        self.popup.show()
        self.input_field.setFocus()

    def insert_completion(self, item):
        if not item:
            return
        text = self.input_field.text()
        last_at_index = text.rfind("@")
        
        # Get absolute path
        rel_path = item.text()
        abs_path = self.file_scanner.get_absolute_path(rel_path)
        
        new_text = text[:last_at_index] + f"[{rel_path}]({abs_path})"
        self.input_field.setText(new_text)
        self.popup.hide()

    def add_item(self):
        text = self.input_field.text().strip()
        if not text:
            return

        current_phase = self.phases[self.current_phase_index]

        if current_phase == "목표":
            # Goal is a single item - auto advance after entering
            self.collected_data["목표"] = text
            self.append_user_message(text)
            self.input_field.clear()
            # Automatically move to next phase
            self.next_phase()
        else:
            self.collected_data[current_phase].append(text)
            self.append_user_message(text)
            self.input_field.clear()

    def next_phase(self):
        # If there's text in input, add it first
        if self.input_field.text().strip():
            self.add_item()

        self.current_phase_index += 1

        if self.current_phase_index >= len(self.phases):
            self.finish_flow()
        else:
            next_phase = self.phases[self.current_phase_index]
            next_phase_korean = self.phase_korean_names[next_phase]
            next_phase_english = self.phase_english_names[next_phase]
            prev_phase_korean = self.phase_korean_names[self.phases[self.current_phase_index-1]]
            self.phase_label.setText(f"현재 단계: {next_phase_korean}")
            particle = self.get_object_particle(next_phase_korean)
            self.append_system_message(f"<b>{prev_phase_korean}</b> 단계가 완료되었습니다!<br/>이제 <b>{next_phase_korean}({next_phase_english})</b>{particle} 입력하세요.")

    def finish_flow(self):
        self.input_field.setDisabled(True)
        self.send_button.setDisabled(True)
        self.next_button.setDisabled(True)
        self.phase_label.setText("완료")
        self.append_system_message("모든 단계가 완료되었습니다!<br/>문서를 생성하고 있습니다...")
        self.phase_completed.emit("DONE", self.collected_data)

    def append_user_message(self, text):
        """Append user message with clean style"""
        # Escape HTML but preserve our markdown-style links
        import html
        text = html.escape(text).replace("&lt;br/&gt;", "<br/>")

        bubble_html = f"""<div style="margin: 0 0 12px 0; text-align: right; line-height: 1.6;"><div style="display: inline-block; color: #e8eaed; padding: 0; max-width: 70%; text-align: left; font-size: 15px; font-family: 'Google Sans', 'SF Pro Display', 'Segoe UI', Arial, sans-serif; line-height: 1.6;">{text}</div></div>"""
        self.chat_history.append(bubble_html)

    def append_system_message(self, text):
        """Append system message with clean style"""
        bubble_html = f"""<div style="margin: 0 0 12px 0; line-height: 1.6;"><div style="display: inline-block; color: #9aa0a6; padding: 0; max-width: 70%; font-size: 15px; font-family: 'Google Sans', 'SF Pro Display', 'Segoe UI', Arial, sans-serif; line-height: 1.6;">{text}</div></div>"""
        self.chat_history.append(bubble_html)

    def show_loading(self, message="번역 중입니다...", subtext="잠시만 기다려주세요..."):
        """Show full-screen loading overlay"""
        self.loading_label.setText(message)
        self.loading_subtext.setText(subtext)
        self.loading_overlay.setGeometry(self.rect())
        self.loading_overlay.raise_()
        self.loading_overlay.show()
        # Start spinner animation
        self.loading_spinner.start()

    def hide_loading(self):
        """Hide loading overlay"""
        self.loading_spinner.stop()
        self.loading_overlay.hide()

    def resizeEvent(self, event):
        """Handle resize to keep loading overlay full-screen"""
        super().resizeEvent(event)
        if hasattr(self, 'loading_overlay'):
            self.loading_overlay.setGeometry(self.rect())

    def focusOutEvent(self, event):
        """Hide popup when widget loses focus"""
        super().focusOutEvent(event)
        if hasattr(self, 'popup'):
            self.popup.hide()

    def input_focus_out(self, event):
        """Hide popup when input field loses focus"""
        if hasattr(self, 'popup'):
            self.popup.hide()
        # Call the original focusOutEvent
        QLineEdit.focusOutEvent(self.input_field, event)

    def reset_chat(self):
        """Reset all collected data and start over"""
        self.current_phase_index = 0
        self.collected_data = {
            "목표": "",
            "컨텍스트": [],
            "단계": [],
            "제약사항": []
        }
        self.chat_history.clear()
        self.input_field.setEnabled(True)
        self.send_button.setEnabled(True)
        self.next_button.setEnabled(True)
        self.input_field.clear()
        self.phase_label.setText(f"현재 단계: {self.phase_korean_names[self.phases[0]]}")
        phase_korean = self.phase_korean_names[self.phases[0]]
        phase_english = self.phase_english_names[self.phases[0]]
        self.append_system_message(f"안녕하세요!<br/><b>{phase_korean}({phase_english})</b>를 입력하여 시작하세요.")
