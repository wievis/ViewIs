#!/usr/bin/env python3
import os
import sys
import argparse
import subprocess
from collections import defaultdict

EXTENSIONS = (".py", ".json", ".xml", ".html", ".css", ".js", ".svg", ".txt")
IGNORED_DIRS = {
    ".git", ".venv", "venv", "__pycache__", ".idea", ".vscode",
    ".qodo", "node_modules", "tests", "migrations", "management",
    "staticfiles", "staticfiles_build"
}

MEP_FILES = {
    "mep_manifest.xml",
    "mep_panel.html",
    "mep_panel.css",
    "mep_panel.js",
    "mep_viewer.html",
    "mep_viewer.js",
    "viewis-mep-link.zip",
}


def is_mep_file(file_name):
    return file_name in MEP_FILES


def should_include_file(file_name, mep_only):
    is_mep = is_mep_file(file_name)
    if mep_only:
        return is_mep
    return not is_mep


def is_ignored_dir(full_path, root_dir):
    rel = os.path.relpath(full_path, root_dir).replace("\\", "/")
    parts = rel.split("/")
    return any(p in IGNORED_DIRS for p in parts) or rel in IGNORED_DIRS


def copy_to_clipboard(text):
    try:
        subprocess.run(["pbcopy"], input=text.encode("utf-8"), check=True)
    except FileNotFoundError:
        try:
            if os.name == "nt":
                subprocess.run(["clip"], input=text.encode("utf-8"), check=True)
            else:
                subprocess.run(["xclip", "-selection", "clipboard"], input=text.encode("utf-8"), check=True)
        except Exception:
            pass


def read_file(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def build_tree(directory, root_dir, mep_only=False, prefix=""):
    entries = []
    for name in os.listdir(directory):
        full = os.path.join(directory, name)
        if os.path.isdir(full):
            if is_ignored_dir(full, root_dir):
                continue
            entries.append((0, name, full))
        else:
            if not should_include_file(name, mep_only):
                continue
            entries.append((1, name, full))
    entries.sort(key=lambda e: (e[0], e[1].lower()))

    lines = []
    valid_entries = []
    for is_file, name, full in entries:
        if is_file:
            valid_entries.append((is_file, name, full, []))
        else:
            sub = build_tree(full, root_dir, mep_only=mep_only, prefix=prefix)
            if not mep_only or sub:
                valid_entries.append((is_file, name, full, sub))

    for i, (is_file, name, full, sub) in enumerate(valid_entries):
        last = i == len(valid_entries) - 1
        connector = "└── " if last else "├── "
        if is_file:
            lines.append(f"{prefix}{connector}{name}")
        else:
            lines.append(f"{prefix}{connector}{name}/")
            extension = "    " if last else "│   "
            lines.extend(build_tree(full, root_dir, mep_only=mep_only, prefix=prefix + extension))
    return lines


def run_tree(root_dir, mep_only=False):
    mode_info = " (Tylko wtyczka MEP)" if mep_only else " (Bez wtyczki MEP)"
    lines = [f"{os.path.basename(root_dir)}/{mode_info}"]
    lines.extend(build_tree(root_dir, root_dir, mep_only=mep_only))
    copy_to_clipboard("\n".join(lines))
    print(f"Drzewko{mode_info} skopiowane do schowka.")


def run_report(root_dir, mep_only=False):
    this_file = os.path.abspath(__file__)
    mode_info = " [TYLKO MEP]" if mep_only else " [website] "
    output = [f"======== {os.path.basename(root_dir)}{mode_info} =========\n\n\n"]

    for current_root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if not is_ignored_dir(os.path.join(current_root, d), root_dir)]

        matched = [
            f for f in sorted(files)
            if f.lower().endswith(EXTENSIONS) and should_include_file(f, mep_only)
        ]
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
    print(f"Raport{mode_info} skopiowany do schowka.")


def run_length(root_dir, mep_only=False):
    this_file = os.path.abspath(__file__)
    total_files = total_lines = total_chars = 0
    per_ext = defaultdict(lambda: [0, 0, 0])

    for current_root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if not is_ignored_dir(os.path.join(current_root, d), root_dir)]

        for file_name in files:
            if not file_name.lower().endswith(EXTENSIONS):
                continue
            if not should_include_file(file_name, mep_only):
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

    mode_info = " (Tylko wtyczka MEP)" if mep_only else " (Bez wtyczki MEP)"
    print(f"\nStatystyki kodu{mode_info}")
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
    parser.add_argument("-m", "--mep", action="store_true", help="uwzględnia TYLKO pliki wtyczki MEP (domyślnie są one pomijane)")

    argv = sys.argv[1:]
    if argv and argv[0].lower() == "raport":
        argv = argv[1:]
    args = parser.parse_args(argv)

    root_dir = os.path.dirname(os.path.abspath(__file__))

    if args.tree:
        run_tree(root_dir, mep_only=args.mep)
        return
    if args.length:
        run_length(root_dir, mep_only=args.mep)
        return

    run_report(root_dir, mep_only=args.mep)


if __name__ == "__main__":
    run()