from phonemizer import phonemize
import re
comprehensive_ipa_symbols = [
    "ɑː", "ɔː", "ɜː", "ɪə", "eə", "ʊə", "eɪ", "aɪ", "ɔɪ", "aʊ", "əʊ", "iː", "uː",
    "p", "b", "t", "d", "k", "ɡ", "f", "v", "θ", "ð", "s", "z", "ʃ", "ʒ", "h",
    "m", "n", "ŋ", "l", "ɹ", "w", "j",
    "dʒ", "tʃ",
    "ɪ", "ɛ", "æ", "ʌ", "ɒ", "ʊ", "ə", "a"
]

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
                    continuous_ipa_of_word = phonemes_of_word.replace(' ', '')
                    tokenized_phonemes =  compiled_comprehensive_ipa_pattern.findall(continuous_ipa_of_word)
                    processed_sequence.extend(tokenized_phonemes)
                except Exception as e:
                    print(f"Warning: Could not phonemize '{segment.strip()}': {e}.")

            elif segment.isspace():
                processed_sequence.append("[SIL]")

            elif ',' in segment: 
                processed_sequence.append("[COMMA]")
            elif any(p in segment for p in ['.', '!', '?']): 
                processed_sequence.append("[PERIOD]")

        processed_sequence.append("[NEWLINE]")

    return processed_sequence

example_lyric_line_with_multiple_punctuation = "This is a test, with commas And periods.\nAlso new line." # Test with more complex punctuation
processed_example_sequence_2 = process_lyric_line(example_lyric_line_with_multiple_punctuation)
print(f"\nOriginal Lyric Line: '{example_lyric_line_with_multiple_punctuation}'")
print(f"Processed Sequence: {processed_example_sequence_2}")