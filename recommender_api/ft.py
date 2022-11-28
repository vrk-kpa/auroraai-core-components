"""search services using fasttext"""
import json
import re
import string
from typing import Dict, List, Union, Any, Tuple
import numpy as np
import torch
import fasttext  # type: ignore

fasttext.FastText.eprint = lambda x: None  # suppress warning


def make_document(service_data: Dict[str, List]) -> str:
    """Extracts description from provided service data."""
    descriptions =  ''
    for item in service_data.get('serviceDescriptions', []):
        desc = item.get('value')
        lang = item.get('language')
        if desc and lang == 'fi':
            descriptions += desc
            descriptions += ' '
        descriptions = descriptions.strip().replace('\n', ' ')
        descriptions += '\n'
    return descriptions


def make_corpus(filepath: str) -> List[Dict[str, str]]:
    """Reads data from JSON file and build a corpus of service descriptions."""
    with open(filepath, 'r', encoding='utf-8') as filehandle:
        data = json.load(filehandle)
    corpus = []
    for key in list(data.keys()):
        service_data = data.get(key)
        document = make_document(service_data)
        corpus.append({'key': key, 'text': document})
    return corpus


def preprocess(corpus: List[Dict[str, str]]) -> List[str]:
    """Separates punctuation from words and converts words to lowercase."""
    preprocessed = []
    for item in corpus:
        doc = item.get('text', '')
        doc = doc.replace('\n', '').replace('\r', '').strip().lower()
        doc = re.sub(r'(?=[-,.:;/\)*\?])(?=[^\s])', r' ', doc)
        doc = re.sub(r'(?<=[-.\(/])(?=[^\s])', r' ', doc)
        preprocessed.append(doc)
    return preprocessed


def save_preprocessed(preprocessed: List[str], filepath: str):
    """Writes preprocessed documents to file."""
    with open(filepath, 'w', encoding='utf-8') as filehandle:
        out = [prep + '\n' for prep in preprocessed]
        filehandle.writelines(out)


def load_preprocessed(filepath: str) -> List[str]:
    """Reads preprocessed documents from file."""
    with open(filepath, 'r', encoding='utf-8') as filehandle:
        preprocessed = filehandle.readlines()
    return [doc.strip('\n') for doc in preprocessed]


def train_unsupervised(filepath: str, modelpath: str) -> Any:
    """Trains fastText using data file speficied, and saves resulting model to disk."""
    model = fasttext.train_unsupervised(filepath, minn=2, maxn=5, dim=300)
    model.save_model(modelpath)


def load_model(modelpath: str):
    """Loads model from file."""
    return fasttext.load_model(modelpath)


def make_embeddings(preprocessed: Union[List, str], model: Any) -> np.ndarray:
    """Vectorizes sentences and documents."""
    result: np.ndarray = np.array([])
    if isinstance(preprocessed, list):
        data = [prep.strip(string.punctuation) for prep in preprocessed]
        vectors = [model.get_sentence_vector(d) for d in data]
        result = np.array(vectors)
    elif isinstance(preprocessed, str):
        result = model.get_sentence_vector(preprocessed)
    return result


def cosine_similarity(query: np.ndarray, search_space: np.ndarray) -> torch.Tensor:
    """Computes cosine similarities for vectorized query and a
    collection of documents."""
    query_tensor = torch.tensor(query)
    search_space_tensor = torch.tensor(search_space)
    return torch.cosine_similarity(query_tensor, search_space_tensor)


def top(cosine_similarities: torch.Tensor, corpus: List[Dict[str, str]],
        k: int=10) -> List[Tuple[Dict[str, str], torch.Tensor]]:
    """Ranks search results based on their similarities. Note that a
    result contains not just the document, but other useful information too."""
    topk = torch.topk(cosine_similarities, k=k)
    result = []  # type: List[Tuple[Dict[str, str], torch.Tensor]]
    for i, score in zip(topk[1], topk[0]):
        result.append((corpus[i], score))
    return result


if __name__ == '__main__':
    ft_model = load_model('./result/ptv2.bin')
    documents = make_corpus('./data/services.json')
    prep = load_preprocessed('./data/ptv.preprocessed2.txt')
    embedded_documents = make_embeddings(prep, ft_model)
    embedded_query = make_embeddings("iltapäivätoimintaa lapsille helsingissä", ft_model)
    similarities = cosine_similarity(embedded_query, embedded_documents)
    top10 = top(similarities, documents, k=10)
    for t in top10:
        print(round(t[1].item(), 3), t[0].get('text', '').strip(), t[0].get('key'))
