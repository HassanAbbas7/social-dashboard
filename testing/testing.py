from googleapiclient.discovery import build
import json

def get_channel_metrics(api_key, channel_id):
    youtube = build('youtube', 'v3', developerKey=api_key)

    # --- STEP 1: Get Channel Stats & Uploads Playlist ID ---
    ch_request = youtube.channels().list(
        part="statistics,contentDetails,snippet",
        id=channel_id
    )
    ch_response = ch_request.execute()

    if not ch_response['items']:
        print("Channel not found.")
        return None

    channel_data = ch_response['items'][0]
    stats = channel_data['statistics']
    uploads_playlist_id = channel_data['contentDetails']['relatedPlaylists']['uploads']
    
    print(f"--- Monitoring: {channel_data['snippet']['title']} ---")
    print(f"Subscribers: {stats.get('subscriberCount', 'Hidden')}")
    print(f"Total Videos: {stats.get('videoCount')}")
    print(f"Total Views:  {stats.get('viewCount')}\n")

    # --- STEP 2: Get Top 5 Recent Video IDs ---
    pl_request = youtube.playlistItems().list(
        part="snippet,contentDetails",
        playlistId=uploads_playlist_id,
        maxResults=5
    )
    pl_response = pl_request.execute()
    
    video_ids = [item['contentDetails']['videoId'] for item in pl_response['items']]

    # --- STEP 3: Get Metrics for those 5 Videos ---
    vid_request = youtube.videos().list(
        part="statistics,snippet",
        id=','.join(video_ids)
    )
    vid_response = vid_request.execute()

    print("Top 5 Recent Videos:")
    for video in vid_response['items']:
        title = video['snippet']['title']
        v_stats = video['statistics']
        print(f"- {title}")
        print(f"  Views: {v_stats.get('viewCount', 0)} | Likes: {v_stats.get('likeCount', 0)}")

# --- CONFIGURATION ---
API_KEY = 'AIzaSyCrMNXPAtXs1Z98p1i66EeiRQWxlTEPAhs'
# Example: MrBeast's Channel ID
CHANNEL_ID = 'UC0gGr2lh1BR-nmiCdJPbEFQ' 

get_channel_metrics(API_KEY, CHANNEL_ID)