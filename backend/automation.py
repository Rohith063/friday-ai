"""
F.R.I.D.A.Y. System Automation — Windows System Control
Handles opening apps, web searches, system status, and more.
"""

import subprocess
import webbrowser
import datetime
import platform
import psutil
import os


# Map of common app names to their Windows executables/commands
APP_MAP = {
    "chrome": "start chrome",
    "google chrome": "start chrome",
    "browser": "start chrome",
    "firefox": "start firefox",
    "edge": "start msedge",
    "notepad": "notepad",
    "calculator": "calc",
    "paint": "mspaint",
    "word": "start winword",
    "excel": "start excel",
    "powerpoint": "start powerpnt",
    "file explorer": "explorer",
    "explorer": "explorer",
    "files": "explorer",
    "task manager": "taskmgr",
    "cmd": "cmd",
    "command prompt": "cmd",
    "terminal": "wt",
    "windows terminal": "wt",
    "powershell": "powershell",
    "settings": "start ms-settings:",
    "spotify": "start spotify:",
    "vscode": "code",
    "visual studio code": "code",
    "vs code": "code",
    "discord": "start discord:",
    "teams": "start msteams:",
    "outlook": "start outlook",
    "snipping tool": "snippingtool",
    "camera": "start microsoft.windows.camera:",
    "clock": "start ms-clock:",
    "maps": "start bingmaps:",
    "weather": "start bingweather:",
    "store": "start ms-windows-store:",
    "xbox": "start xbox:",
}


def open_app(app_name: str) -> str:
    """Open a Windows application by name."""
    app_key = app_name.lower().strip()
    command = APP_MAP.get(app_key)

    if command:
        try:
            subprocess.Popen(command, shell=True)
            return f"Launched {app_name} successfully."
        except Exception as e:
            return f"Failed to open {app_name}: {str(e)}"
    else:
        # Try to run it directly as a command
        try:
            subprocess.Popen(f"start {app_key}", shell=True)
            return f"Attempting to launch {app_name}."
        except Exception as e:
            return f"I couldn't find an application called '{app_name}'. Error: {str(e)}"


def search_web(query: str) -> str:
    """Search the web using Google."""
    url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
    webbrowser.open(url)
    return f"Searching Google for: {query}"


def open_website(url: str) -> str:
    """Open a website in the default browser."""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    webbrowser.open(url)
    return f"Opening {url}"


def get_time() -> str:
    """Get current date and time."""
    now = datetime.datetime.now()
    return now.strftime("It's %I:%M %p on %A, %B %d, %Y.")


def get_system_status() -> dict:
    """Get comprehensive system status information."""
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    boot_time = datetime.datetime.fromtimestamp(psutil.boot_time())
    uptime = datetime.datetime.now() - boot_time
    battery = psutil.sensors_battery()

    status = {
        "cpu_percent": cpu_percent,
        "memory_total_gb": round(memory.total / (1024**3), 1),
        "memory_used_gb": round(memory.used / (1024**3), 1),
        "memory_percent": memory.percent,
        "disk_total_gb": round(disk.total / (1024**3), 1),
        "disk_used_gb": round(disk.used / (1024**3), 1),
        "disk_percent": round(disk.percent, 1),
        "uptime_hours": round(uptime.total_seconds() / 3600, 1),
        "platform": platform.platform(),
        "processor": platform.processor(),
    }

    if battery:
        status["battery_percent"] = battery.percent
        status["battery_plugged"] = battery.power_plugged

    return status


def take_screenshot() -> str:
    """Take a screenshot and save it to Desktop."""
    try:
        import mss
        desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(desktop, f"friday_screenshot_{timestamp}.png")

        with mss.mss() as sct:
            sct.shot(output=filename)

        return f"Screenshot saved to Desktop as friday_screenshot_{timestamp}.png"
    except ImportError:
        return "Screenshot module not installed. Run: pip install mss"
    except Exception as e:
        return f"Failed to take screenshot: {str(e)}"


def execute_action(action_name: str, params: dict) -> str:
    """Execute a system action based on AI intent detection."""
    actions = {
        "open_app": lambda p: open_app(p.get("app_name", "")),
        "search_web": lambda p: search_web(p.get("query", "")),
        "open_website": lambda p: open_website(p.get("url", "")),
        "get_time": lambda p: get_time(),
        "system_status": lambda p: str(get_system_status()),
        "screenshot": lambda p: take_screenshot(),
    }

    handler = actions.get(action_name)
    if handler:
        return handler(params)
    return f"Unknown action: {action_name}"
