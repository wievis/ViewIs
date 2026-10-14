import os
import sys
import argparse
import subprocess
from collections import defaultdict

EXTENSIONS = (".py", ".json", ".xml", ".html", ".css", ".js", ".svg", ".txt")
IGNORED_DIRS = {
    ".git", ".venv", "venv", "__pycache__", ".idea", ".vscode",
    "node_modules", "tests", "migrations", "management"
}


def copy_to_clipboard(text):
    subprocess.run(["pbcopy"], input=text.encode("utf-8"), check=True)


def read_file(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def build_tree(directory, prefix=""):
    entries = []
    for name in os.listdir(directory):
        full = os.path.join(directory, name)
        if os.path.isdir(full):
            if name in IGNORED_DIRS:
                continue
            entries.append((0, name, full))
        else:
            entries.append((1, name, full))
    entries.sort(key=lambda e: (e[0], e[1].lower()))

    lines = []
    for i, (is_file, name, full) in enumerate(entries):
        last = i == len(entries) - 1
        connector = "└── " if last else "├── "
        if is_file:
            lines.append(f"{prefix}{connector}{name}")
        else:
            lines.append(f"{prefix}{connector}{name}/")
            extension = "    " if last else "│   "
            lines.extend(build_tree(full, prefix + extension))
    return lines


def run_tree(root_dir):
    lines = [f"{os.path.basename(root_dir)}/"]
    lines.extend(build_tree(root_dir))
    copy_to_clipboard("\n".join(lines))
    print("Drzewko skopiowane do schowka.")


def run_report(root_dir):
    this_file = os.path.abspath(__file__)
    output = [f"======== {os.path.basename(root_dir)} =========\n\n\n"]

    for current_root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]

        matched = [f for f in sorted(files) if f.lower().endswith(EXTENSIONS)]
        if not matched:
            continue

        rel_folder = os.path.relpath(current_root, root_dir)
        folder_name = os.path.basename(current_root) if rel_folder != "." else os.path.basename(root_dir)

        output.append(f"-- -- -- -- --{folder_name}-- -- -- -- --\n\n")

        for file_name in matched:
            file_path = os.path.join(current_root, file_name)
            if os.path.abspath(file_path) == this_file:
                continue
            output.append(f"------------{file_name}--------------\n")
            output.append(read_file(file_path))
            output.append("\n\n")

        output.append("\n")

    output.append("=========================")
    copy_to_clipboard("".join(output))
    print("Raport skopiowany do schowka.")


def run_length(root_dir):
    this_file = os.path.abspath(__file__)
    total_files = total_lines = total_chars = 0
    per_ext = defaultdict(lambda: [0, 0, 0])

    for current_root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]

        for file_name in files:
            if not file_name.lower().endswith(EXTENSIONS):
                continue
            file_path = os.path.join(current_root, file_name)
            if os.path.abspath(file_path) == this_file:
                continue

            content = read_file(file_path)
            lines = len(content.splitlines())
            chars = len(content)
            ext = os.path.splitext(file_name)[1].lower()

            per_ext[ext][0] += 1
            per_ext[ext][1] += lines
            per_ext[ext][2] += chars
            total_files += 1
            total_lines += lines
            total_chars += chars

    print("\nStatystyki kodu")
    print("-" * 44)
    print(f"{'typ':<8}{'pliki':>8}{'linie':>12}{'znaki':>14}")
    for ext in sorted(per_ext):
        f, l, c = per_ext[ext]
        print(f"{ext:<8}{f:>8}{l:>12,}{c:>14,}".replace(",", " "))
    print("-" * 44)
    print(f"{'RAZEM':<8}{total_files:>8}{total_lines:>12,}{total_chars:>14,}".replace(",", " "))


def run():
    parser = argparse.ArgumentParser(
        add_help=False,
        description="Narzędzie do generowania raportu ze struktury projektu i kopiowania do schowka.",
    )
    parser.add_argument("-h", "--help", action="help", help="wyświetla pomoc")
    parser.add_argument("-t", "--tree", action="store_true", help="kopiuje do schowka drzewko plików i folderów")
    parser.add_argument("-l", "--length", action="store_true", help="wyświetla statystyki linii i znaków kodu")

    argv = sys.argv[1:]
    if argv and argv[0].lower() == "raport":
        argv = argv[1:]
    args = parser.parse_args(argv)

    root_dir = os.path.dirname(os.path.abspath(__file__))

    if args.tree:
        run_tree(root_dir)
        return
    if args.length:
        run_length(root_dir)
        return

    run_report(root_dir)


if __name__ == "__main__":
    run()