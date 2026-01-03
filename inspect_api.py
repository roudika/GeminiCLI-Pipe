from youtube_transcript_api import YouTubeTranscriptApi
import inspect

print("Attributes of YouTubeTranscriptApi:")
for name, obj in inspect.getmembers(YouTubeTranscriptApi):
    if not inspect.ismethod(obj) and not inspect.isfunction(obj):
        continue
    print(f"- {name}")
