import torch
import re

class VocalVectorizer:
    def __init__(self):
        # 1. Define our Vocabulary (Base CMU Arpabet + Custom Tags)
        # Note: We removed the numbers from the vowels!
        valid_symbols = [
            '<PAD>', '<SPACE>', '<COMMA>', '<PERIOD>', '<QUESTION>', 
            '<EXCLAMATION>', '<NEWLINE>',
            'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'B', 'CH', 'D', 'DH', 'EH', 
            'ER', 'EY', 'F', 'G', 'HH', 'IH', 'IY', 'JH', 'K', 'L', 'M', 'N', 
            'NG', 'OW', 'OY', 'P', 'R', 'S', 'SH', 'T', 'TH', 'UH', 'UW', 
            'V', 'W', 'Y', 'Z', 'ZH'
        ]
        
        # Create the mapping dictionaries
        self.symbol_to_id = {s: i for i, s in enumerate(valid_symbols)}
        self.id_to_symbol = {i: s for i, s in enumerate(valid_symbols)}
        
        # Stress definitions: 
        # Vowels get 0, 1, or 2. 
        # We assign 3 to consonants and punctuation (meaning "No Stress Applicable").
        self.NONE_STRESS = 3 

    def __call__(self, clean_tokens):
        phoneme_ids = []
        stress_ids = []
        
        for token in clean_tokens:
            # Handle explicit tags (e.g., '<SPACE>')
            if token.startswith('<'):
                base_phone = token
                stress = self.NONE_STRESS
            else:
                # Use Regex to split the letter from the number (e.g., 'AY1' -> 'AY', 1)
                match = re.match(r"([A-Z]+)(\d)?", token)
                if match:
                    base_phone = match.group(1)
                    # If there's a number, use it. Otherwise, it's a consonant.
                    stress = int(match.group(2)) if match.group(2) else self.NONE_STRESS
                else:
                    continue # Skip malformed tokens
            
            # Map to Integer ID
            if base_phone in self.symbol_to_id:
                phoneme_ids.append(self.symbol_to_id[base_phone])
                stress_ids.append(stress)
            else:
                print(f"Warning: Token '{base_phone}' not found in vocabulary!")
                
        # Return as PyTorch Tensors
        return torch.tensor(phoneme_ids, dtype=torch.long), torch.tensor(stress_ids, dtype=torch.long)

# --- Let's test it with our cleaned tokens ---
clean_tokens = ['AY1', '<SPACE>', 'N', 'EH1', 'V', 'ER0', '<SPACE>', 'S', 'L', 'IY1', 'P', '<COMMA>']

vectorizer = VocalVectorizer()
phoneme_tensor, stress_tensor = vectorizer(clean_tokens)

print("Phoneme Tensor:", phoneme_tensor)
print("Stress Tensor: ", stress_tensor)



import torch
import torch.nn as nn

class RapVocalsEmbedding(nn.Module):
    def __init__(self, num_phonemes=80, num_stress_levels=4, hidden_dim=256):
        super().__init__()
        
        # These are the LEARNABLE matrices. 
        # PyTorch will update these weights during training.
        self.phoneme_embedding = nn.Embedding(
            num_embeddings=num_phonemes, 
            embedding_dim=hidden_dim
        )
        
        self.stress_embedding = nn.Embedding(
            num_embeddings=num_stress_levels, 
            embedding_dim=hidden_dim
        )

    def forward(self, phoneme_ids, stress_ids):
        # 1. Convert 1D integer IDs to 2D continuous learned vectors
        # Shape goes from (Sequence_Length) -> (Sequence_Length, 256)
        phone_vecs = self.phoneme_embedding(phoneme_ids)
        stress_vecs = self.stress_embedding(stress_ids)
        
        # 2. Add them together so the sound vector absorbs the stress information
        final_vectors = phone_vecs + stress_vecs
        
        return final_vectors

# --- Let's see the dimensions in action ---
# Assuming phoneme_tensor and stress_tensor are the 1D outputs from our previous code
# phoneme_tensor = tensor([12,  1, 29...])

embedder = RapVocalsEmbedding(hidden_dim=256)
learned_vectors = embedder(phoneme_tensor, stress_tensor)

print(f"Original ID shape: {phoneme_tensor.shape}")
print(f"New Learned Vector shape: {learned_vectors.shape}")