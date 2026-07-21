FROM node:22.22.0-bookworm

RUN apt-get update \
    && apt-get install --yes --no-install-recommends \
        poppler-utils \
        tesseract-ocr \
        tesseract-ocr-deu \
        tesseract-ocr-eng \
        tesseract-ocr-fra \
        tesseract-ocr-ita \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
