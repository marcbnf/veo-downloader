import re
import requests


class NoVideoError(Exception):
    pass


_PATTERN = re.compile(
    r"https://c\.veocdn\.com/[a-z0-9-]+/standard/machine/[a-z0-9]+/",
    re.IGNORECASE,
)


def get_video_urls_from_veo_links(veo_links: list[str]) -> list[str]:
    return [get_video_url_from_veo(link) for link in veo_links]


def get_video_url_from_veo(veo_link: str, timeout: int = 20) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    r = requests.get(veo_link, headers=headers, timeout=timeout)
    r.raise_for_status()

    m = _PATTERN.search(r.text)
    if not m:
        raise NoVideoError("Aucune URL veocdn trouvée dans le HTML.")

    return m.group(0) + "video.mp4"

veo_link = "https://app.veo.co/matches/..."  # Remplacez par votre lien VEO

try:
    print(get_video_url_from_veo(veo_link))
except NoVideoError:
    print("Pas d'URL vidéo détectée (page peut-être rendue en JS ou accès restreint).")
