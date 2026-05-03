from pathlib import Path

SAMPLES_DIR = Path(__file__).resolve().parent.parent / "samples"

SAMPLE_META = {
    "texture_loop.frag": "纹理循环",
    "branchy.frag": "条件分支",
    "conversion.frag": "类型转换",
    "simple_blur.frag": "高斯模糊",
}


def list_samples() -> list[dict]:
    return [
        {"name": name, "label": label}
        for name, label in SAMPLE_META.items()
        if (SAMPLES_DIR / name).is_file()
    ]


def load_sample(name: str) -> str | None:
    path = SAMPLES_DIR / name
    if not path.is_file() or path.suffix not in (
        ".frag",
        ".vert",
        ".glsl",
        ".comp",
        ".geom",
    ):
        return None
    return path.read_text()
