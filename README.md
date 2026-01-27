# AutoAgent 🚗🤖

AutoAgent is a Raspberry Pi + AI powered car assistant that helps users diagnose car problems and learn how to fix them.

It combines:
- **OBD2 diagnostics (error codes + live sensor data)**
- **AI explanations + step-by-step troubleshooting**
- **A full car guide app** (repairs + installs + car questions, even outside OBD2)

---

## What It Does

### ✅ OBD2 Diagnostic Mode (Raspberry Pi Device)
- Connects to the car’s ECU through the OBD2 port
- Reads diagnostic trouble codes (DTCs)
- Collects live sensor values (RPM, coolant temp, speed, etc.)
- Sends results to the phone/computer app so the user can see the issue instantly

Example:
> A dashboard light comes on → AutoAgent shows what it means + what to do next

---

### ✅ AI Car Guide Mode (App)
AutoAgent also works as a general car help assistant, including:
- How-to tutorials (ex: replace wipers, change battery, swap air filter)
- Aftermarket install help (ex: installing a new radio/head unit)
- Part suggestions + car knowledge database (future feature)
- User can ask questions anytime and get clear answers

---

## Hardware Needed
- Raspberry Pi 5 (or similar)
- OBD2 adapter (connects Pi to the car)

**OBD2 adapter to buy (Amazon):**
https://a.co/d/gZwIsnc

---

## Tech Stack (Planned)
- **Python** (OBD2 reading + device logic)
- **python-OBD** (OBD2 data access)
- **Local server** (FastAPI or Flask)
- **Mobile/Web app UI** (phone-friendly dashboard)
- **AI assistant** (answers questions + explains scan results)

---

## Goal
Make car diagnostics and repairs easy for anyone:
- Simple explanations
- Clear urgency levels (Safe / Caution / Stop driving)
- Steps the user can actually follow

---

## Future Ideas
- Scan history + saved reports
- Offline “basic diagnosis mode”
- QR code pairing to connect Pi → phone instantly
- Parts database + mechanic-ready export report
