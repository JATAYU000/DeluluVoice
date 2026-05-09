from phonemizer import phonemize
import re
import glob
import os
from transphone import read_tokenizer


comprehensive_ipa_symbols = [
    "ɑː", "ɔː", "ɜː", "ɪə", "eə", "ʊə", "eɪ", "aɪ", "ɔɪ", "aʊ", "əʊ", "iː", "uː",
    "p", "b", "t", "d", "k", "ɡ", "f", "v", "θ", "ð", "s", "z", "ʃ", "ʒ", "h",
    "m", "n", "ŋ", "l", "ɹ", "w", "j",
    "dʒ", "tʃ",
    "ɪ", "ɛ", "æ", "ʌ", "ɒ", "ʊ", "ə", "a"
]
comprehensive_ipa_symbols.extend(['a', 'b', 'd', 'e', 'f', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 's', 't', 'u', 'v', 'w', 'z','y','x' 'æ', 'ð', 'ŋ', 'ɐ', 'ɑ', 'ɔ', 'ə', 'ɚ', 'ɛ', 'ɜ', 'ɡ', 'ɪ', 'ɹ', 'ɾ', 'ʃ', 'ʊ', 'ʌ', 'ʒ', 'ʔ', 'ː', '̩', 'θ', 'ᵻ',])

comprehensive_ipa_symbols.sort(key=len, reverse=True)
comprehensive_ipa_regex_pattern = "|".join(comprehensive_ipa_symbols)
compiled_comprehensive_ipa_pattern = re.compile(comprehensive_ipa_regex_pattern)


def process_lyric_line(text_line):
    """
    Phonemizes a text line, applies granular IPA tokenization, and inserts special tokens
    for spaces and punctuation. Handles newlines by splitting on them first and inserting
    [NEWLINE] tokens at each line boundary.

    Args:
        text_line (str): A single line (or multiple lines) of lyrical text.

    Returns:
        list: A sequence of granular phonemes and special tokens.
    """
    processed_sequence = []
    lines = text_line.split('\n')

    for line_idx, line in enumerate(lines):
        segments = re.split(r'([.,!?\s]+)', line)

        for segment in segments:
            if not segment: 
                continue
                
            if segment.strip() and any(c.isalnum() for c in segment):
                try:
                    phonemes_of_word = phonemize(segment.strip(), language='en-us', backend='espeak', strip=True)
                    print(phonemes_of_word)
                    continuous_ipa_of_word = phonemes_of_word.replace(' ', '')
                    tokenized_phonemes =  compiled_comprehensive_ipa_pattern.findall(continuous_ipa_of_word)
                    processed_sequence.extend(tokenized_phonemes)
                except Exception as e:
                    print(f"Warning: Could not phonemize '{segment.strip()}': {e}.")

            elif segment.isspace():
                processed_sequence.append("[SIL]")
            elif '(' in segment:
                processed_sequence.append("[OPEN_PAREN]")
            elif ')' in segment:
                processed_sequence.append("[CLOSE_PAREN]")
            elif ',' in segment: 
                processed_sequence.append("[COMMA]")
            elif '.' in segment: 
                processed_sequence.append("[PERIOD]")
            elif '!' in segment:
                processed_sequence.append("[EXCLAMATION]")
            elif '?' in segment:
                processed_sequence.append("[QUESTION]")

        processed_sequence.append("[NEWLINE]")

    return processed_sequence

def test_phoneme_tokenizer():
    example_lyric_line_with_multiple_punctuation = "This is a test, with commas And periods.\nAlso new line." # Test with more complex punctuation
    processed_example_sequence_2 = process_lyric_line(example_lyric_line_with_multiple_punctuation)
    print(f"\nOriginal Lyric Line: '{example_lyric_line_with_multiple_punctuation}'")
    print(f"Processed Sequence: {processed_example_sequence_2}")

def build_dataset_and_vocab(directory_path):
    dataset = []
    unique_ipa_chars = set()
    
    lrc_files = glob.glob(os.path.join(directory_path, "*.lrc"))
    print(f"Found {len(lrc_files)} files. Processing...")

    for file_path in lrc_files[50:]:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            target_lyrics = lines[3:-3]
            
            for line in target_lyrics:
                clean_line = line.strip()
                if not clean_line:
                    continue
                
                dataset.append(clean_line)
                
                try:
                    raw_ipa = phonemize(clean_line, language='en-us', backend='espeak', strip=True)
                    unique_ipa_chars.update(list(raw_ipa.replace(" ", "")))
                except Exception as e:
                    pass
        print(f"Processed '{os.path.basename(file_path)}' - Total lines so far: {len(dataset)}")
    special_tokens = ["[SIL]", "[COMMA]", "[PERIOD]", "[NEWLINE]", "[EXCLAMATION]", "[QUESTION]", "[OPEN_PAREN]", "[CLOSE_PAREN]"]
    full_vocab = sorted(list(unique_ipa_chars)) + special_tokens
    
    return dataset, full_vocab

def get_transphone_sequence(text, lang='eng'):
    tokenizer = read_tokenizer(lang)
    processed_sequence = []
    punct_map = {
        '(': "[OPEN_PAREN]",
        ')': "[CLOSE_PAREN]",
        ',': "[COMMA]",
        '.': "[PERIOD]",
        '!': "[EXCLAMATION]",
        '?': "[QUESTION]"
    }

    lines = text.split('\n')

    for line in lines:
        segments = re.split(r'([.,!?()\s])', line)
        for segment in segments:
            if not segment:
                continue
            if any(c.isalnum() for c in segment):
                phonemes = tokenizer.tokenize(segment.strip())
                processed_sequence.extend(phonemes)
            elif segment.isspace():
                processed_sequence.append("[SIL]")
            elif segment in punct_map:
                processed_sequence.append(punct_map[segment])

        processed_sequence.append("[NEWLINE]")
    return processed_sequence

input_text = "Hello This is a test, (really)!"
result = get_transphone_sequence(input_text)

#print(f"Original: {input_text}")
#print(f"Sequence: {result}")
import pyphen
from phonemizer import phonemize

dic = pyphen.Pyphen(lang='en_US')

word = "hello world, this is a test."
syllables = dic.inserted(word).split('-')
from g2p_en import G2p

g2p = G2p()
phoneme_syllables = [g2p(s) for s in syllables]

print(phoneme_syllables)
