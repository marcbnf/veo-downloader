import json
import re
import requests

def int_or_none(value, scale=1):
    if value is None:
        return None
    try:
        return int(value) // scale
    except (TypeError, ValueError):
        return None

def str_or_none(value):
    if value is None:
        return None
    return str(value)

def url_or_none(url):
    if not url or not isinstance(url, str):
        return None
    return url if re.match(r'^https?://', url) else None

def mimetype2ext(mimetype):
    if not mimetype:
        return None
    mapping = {
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/quicktime': 'mov',
    }
    return mapping.get(mimetype.lower())

def unified_timestamp(date_str):
    # Gère des formats simples ou retourne None
    if not date_str:
        return None
    # Vous pouvez ajouter un parsing de date ISO si nécessaire (ex: via datetime)
    return date_str

def extract_veo_match(match_url):
    # 1. Extraire l'ID de la correspondance depuis l'URL
    url_pattern = r'https?://app\.veo\.co/matches/(?P<id>[0-9A-Za-z-_]+)'
    match = re.match(url_pattern, match_url)
    if not match:
        raise ValueError("URL Veo invalide ou non reconnue.")

    video_id = match.group('id')
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    # 2. Télécharger les métadonnées de la vidéo
    metadata_url = f'https://app.veo.co/api/app/matches/{video_id}'
    resp_meta = requests.get(metadata_url, headers=headers)
    resp_meta.raise_for_status()
    metadata = resp_meta.json()

    # 3. Télécharger les données des formats vidéo
    videos_url = f'https://app.veo.co/api/app/matches/{video_id}/videos'
    resp_videos = requests.get(videos_url, headers=headers)
    resp_videos.raise_for_status()
    video_data = resp_videos.json()

    formats = []
    for fmt in video_data:
        mimetype = str_or_none(fmt.get('mime_type'))
        format_url = url_or_none(fmt.get('url'))

        # Ignorer si l'URL est absente ou si c'est un fichier de configuration transport stream (.ts)
        if not format_url or mimetype == 'video/mp2t':
            continue

        height = int_or_none(fmt.get('height'))
        render_type = str_or_none(fmt.get('render_type'))
        format_id = f'{render_type}-{height}p' if render_type and height else None

        # Gestion spécifique au panorama si l'URL n'est pas valide
        if render_type == 'panorama':
            # Vérification simple de validité de l'URL du panorama
            try:
                head_check = requests.head(format_url, headers=headers, timeout=5)
                if head_check.status_code >= 400:
                    continue
            except requests.RequestException:
                continue

        formats.append({
            'url': format_url,
            'format_id': format_id,
            'ext': mimetype2ext(mimetype),
            'width': int_or_none(fmt.get('width')),
            'height': height,
            'vbr': int_or_none(fmt.get('bit_rate'), scale=1000),
        })

    # 4. Assembler le dictionnaire de résultats final
    result = {
        'id': video_id,
        'title': str_or_none(metadata.get('title')),
        'formats': formats,
        'thumbnail': url_or_none(metadata.get('thumbnail')),
        'timestamp': metadata.get('created'),
        'view_count': int_or_none(metadata.get('view_count')),
        'duration': int_or_none(metadata.get('duration')),
    }

    return result

if __name__ == '__main__':
    test_url = 'https://app.veo.co/matches/20201027-last-period/'
    test_url = 'https://app.veo.co/matches/20261107-match-federale-2-v6552ae5/'
    print(f"Extraction des informations pour : {test_url}\n")
    try:
        data = extract_veo_match(test_url)
        print(json.dumps(data, indent=4, ensure_ascii=False))
    except Exception as e:
        print(f"Une erreur est survenue : {e}")
