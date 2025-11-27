from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QTextEdit, QLineEdit, QListWidget, 
    QLabel, QAbstractItemView
)
from PyQt6.QtCore import Qt, pyqtSignal, QEvent
from PyQt6.QtGui import QKeyEvent

class ChatWidget(QWidget):
    phase_completed = pyqtSignal(str, object) # phase_name, data

    def __init__(self, file_scanner):
        super().__init__()
        self.file_scanner = file_scanner
        self.phases = ["Goal", "Context", "Steps", "Constraints"]
        self.current_phase_index = 0
        self.collected_data = {
            "Goal": "",
            "Context": [],
            "Steps": [],
            "Constraints": []
        }
        
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout()
        
        # Chat History
        self.chat_history = QTextEdit()
        self.chat_history.setReadOnly(True)
        layout.addWidget(self.chat_history)
        
        # Current Phase Label
        self.phase_label = QLabel(f"Current Phase: {self.phases[0]}")
        layout.addWidget(self.phase_label)
        
        # Input Area
        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText("Type here... (Enter to add, Ctrl+Enter to next phase, @ for files)")
        self.input_field.installEventFilter(self)
        layout.addWidget(self.input_field)
        
        # Autocomplete Popup
        self.popup = QListWidget(self)
        self.popup.setWindowFlags(Qt.WindowType.ToolTip)
        self.popup.hide()
        self.popup.itemClicked.connect(self.insert_completion)
        
        self.setLayout(layout)
        self.append_system_message(f"Please enter the **{self.phases[0]}**.")

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

        self.popup.clear()
        self.popup.addItems(filtered)
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
        
        if current_phase == "Goal":
            # Goal is usually a single block, but we allow appending lines
            if self.collected_data["Goal"]:
                self.collected_data["Goal"] += "\n" + text
            else:
                self.collected_data["Goal"] = text
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
            self.phase_label.setText(f"Current Phase: {next_phase}")
            self.append_system_message(f"Phase **{self.phases[self.current_phase_index-1]}** completed. Now enter **{next_phase}**.")

    def finish_flow(self):
        self.input_field.setDisabled(True)
        self.append_system_message("All phases completed. Generating draft...")
        self.phase_completed.emit("DONE", self.collected_data)

    def append_user_message(self, text):
        self.chat_history.append(f"<b>User:</b> {text}")

    def append_system_message(self, text):
        self.chat_history.append(f"<b>System:</b> {text}")
