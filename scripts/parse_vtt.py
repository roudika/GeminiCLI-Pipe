import re
import sys
import json

def clean_vtt_to_text(vtt_path):
    """
    Parse a VTT file and extract clean transcript text.
    Removes timestamps, formatting tags, and deduplicates rolling captions.
    """
    try:
        with open(vtt_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        return {"success": False, "error": f"VTT file not found: {vtt_path}"}
    except Exception as e:
        return {"success": False, "error": f"Error reading VTT file: {str(e)}"}

    transcript_lines = []
    last_line = ""
    
    for line in lines:
        line = line.strip()
        
        # Skip empty lines, headers, and timestamps
        if not line or line.startswith('WEBVTT') or line.startswith('Kind:') or line.startswith('Language:') or '-->' in line:
            continue
        
        # Remove HTML-like tags (e.g., <c>, <00:00:01.234>)
        line = re.sub(r'<[^>]+>', '', line)
        line = line.strip()
        
        if not line:
            continue
        
        # Deduplicate: VTT files often have rolling captions where each line is a superset of the previous
        if line != last_line:
            # Check if this line is an extension of the previous line
            if last_line and line.startswith(last_line):
                # Replace the last line with the longer version
                if transcript_lines:
                    transcript_lines[-1] = line
            elif last_line and last_line.startswith(line):
                # Current line is shorter, skip it
                continue
            else:
                # New content, add it
                transcript_lines.append(line)
            
            last_line = line
    
    # Join all lines with spaces
    full_transcript = " ".join(transcript_lines)
    
    return {
        "success": True,
        "transcript": full_transcript
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No VTT file path provided"}))
        sys.exit(1)
    
    vtt_path = sys.argv[1]
    result = clean_vtt_to_text(vtt_path)
    print(json.dumps(result))
    
    if not result["success"]:
        sys.exit(1)
