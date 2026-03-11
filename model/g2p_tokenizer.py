import nltk
import re
from nltk.corpus import cmudict
cmu = cmudict.dict()

def verse_to_phoneme_vector(verse):
    """
    Parses a verse into a flat 1D list of individual phonemes, spaces, and punctuation.
    """
    raw_tokens = re.findall(r"[\w']+|[.,\n!?]", verse.lower())
    flat_vector = []
    
    for i, token in enumerate(raw_tokens):
        if re.match(r"[\w']+", token):
            clean_word = token.replace("'", "")
            
            if clean_word in cmu:
                phonemes = cmu[clean_word][0]
                flat_vector.extend(phonemes)
            else:
                flat_vector.append("<UNK>")
            
            if i + 1 < len(raw_tokens) and re.match(r"[\w']+", raw_tokens[i+1]):
                flat_vector.append("<SPACE>")
                
        elif token == ',':
            flat_vector.append("<COMMA>")
            if i + 1 < len(raw_tokens) and re.match(r"[\w']+", raw_tokens[i+1]):
                flat_vector.append("<SPACE>")
                
        elif token == '\n':
            flat_vector.append("<NEWLINE>")
            
        elif token in ['.', '!', '?']:
            flat_vector.append("<PERIOD>")
            if i + 1 < len(raw_tokens) and re.match(r"[\w']+", raw_tokens[i+1]):
                flat_vector.append("<SPACE>")
                
    return flat_vector

def test_tokenizer():
    nltk.download('cmudict', quiet=True)
    sample_verse = "I never sleep, cause sleep is the cousin of death.\nBeyond the walls of intelligence, life is defined."
    vector = verse_to_phoneme_vector(sample_verse)

    print("Final Phoneme Vector:\n")
    print(vector)



def clean_g2p_tokens(raw_tokens):
    """
    Cleans raw g2p_en output by removing garbage tokens, fixing space 
    alignment around punctuation, and applying explicit <TAGS>.
    """
    cleaned_vector = []
    
    symbol_map = {
        ' ': '<SPACE>',
        ',': '<COMMA>',
        '.': '<PERIOD>',
        '?': '<QUESTION>',
        '!': '<EXCLAMATION>',
        '\n': '<NEWLINE>'
    }
    
    ignore_list = ["'", '"', '-', ':', ';']
    
    for token in raw_tokens:
        if token in ignore_list:
            continue
            
        if token in symbol_map:
            mapped_token = symbol_map[token]
            
            if mapped_token == '<SPACE>' and (not cleaned_vector or cleaned_vector[-1] == '<SPACE>'):
                continue
                
            if mapped_token in ['<COMMA>', '<PERIOD>', '<QUESTION>', '<EXCLAMATION>']:
                if cleaned_vector and cleaned_vector[-1] == '<SPACE>':
                    cleaned_vector.pop()
            
            cleaned_vector.append(mapped_token)
        else:
            cleaned_vector.append(token)
            
    if cleaned_vector and cleaned_vector[-1] == '<SPACE>':
        cleaned_vector.pop()
        
    return cleaned_vector

def test_g2p_cleaning():
    from g2p_en import G2p

    nltk.download('averaged_perceptron_tagger_eng', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
    nltk.download('cmudict', quiet=True)

    g2p = G2p()
    verse = "I never sleep, 'cause sleep is the cousin of death."
    raw_tokens = g2p(verse)
    final_tokens = clean_g2p_tokens(raw_tokens)

    print(final_tokens)