from ..tools import saveContent

content = """
# Project Title: Markdown Showcase

Welcome to the *Markdown Showcase* project! This document demonstrates the most common features of **Markdown** formatting. It's designed to be a quick reference and a template for your own projects. The file you are reading is probably a `README.md`.

---

## 🚀 Key Features

* **Simplicity**: Easy to write and read.
* **Platform Agnostic**: Renders on GitHub, GitLab, VS Code, and more.
* **Extensible**: Supports HTML for more complex formatting.
    * You can create nested lists for sub-points.
    * It helps with organization.
* ~~Not a feature~~: This is strikethrough text.

## 🛠️ Installation Steps

1.  **Clone the repository.**
    Open your terminal and run the following command:
    ```bash
    git clone [https://github.com/username/repository.git](https://github.com/username/repository.git)
    ```
2.  **Navigate to the directory.**
    ```bash
    cd repository
    ```
3.  **Install dependencies.**
    The following shows a Python code block example:
    ```python
    pip install -r requirements.txt
    ```

## 📊 Configuration Table

| Parameter     | Type    | Default Value | Description                 |
|---------------|---------|---------------|-----------------------------|
| `PORT`        | Integer | `8080`        | Port for the web server.    |
| `DEBUG`       | Boolean | `False`       | Toggles debug mode.         |
|
"""

title = "sample_content"

saveContent(content, title)