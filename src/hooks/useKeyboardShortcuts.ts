import { useEffect } from "react";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlPressed = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const shiftPressed = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altPressed = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlPressed && shiftPressed && altPressed && keyMatches) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.callback(e);
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
