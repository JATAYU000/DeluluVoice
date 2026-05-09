import torch
import re

class VocalVectorizer:
    def __init__(self):
        valid_symbols = [
            '<PAD>', '<SPACE>', '<COMMA>', '<PERIOD>', '<QUESTION>', 
            '<EXCLAMATION>', '<NEWLINE>',
            'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'B', 'CH', 'D', 'DH', 'EH', 
            'ER', 'EY', 'F', 'G', 'HH', 'IH', 'IY', 'JH', 'K', 'L', 'M', 'N', 
            'NG', 'OW', 'OY', 'P', 'R', 'S', 'SH', 'T', 'TH', 'UH', 'UW', 
            'V', 'W', 'Y', 'Z', 'ZH'
        ]
        
        self.symbol_to_id = {s: i for i, s in enumerate(valid_symbols)}
        self.id_to_symbol = {i: s for i, s in enumerate(valid_symbols)}
        
        self.NONE_STRESS = 3 

    def __call__(self, clean_tokens):
        phoneme_ids = []
        stress_ids = []
        
        for token in clean_tokens:
            if token.startswith('<'):
                base_phone = token
                stress = self.NONE_STRESS
            else:
                match = re.match(r"([A-Z]+)(\d)?", token)
                if match:
                    base_phone = match.group(1)
                    stress = int(match.group(2)) if match.group(2) else self.NONE_STRESS
                else:
                    continue 
            
            if base_phone in self.symbol_to_id:
                phoneme_ids.append(self.symbol_to_id[base_phone])
                stress_ids.append(stress)
            else:
                print(f"Warning: Token '{base_phone}' not found in vocabulary!")
                
        return torch.tensor(phoneme_ids, dtype=torch.long), torch.tensor(stress_ids, dtype=torch.long)

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
        
        self.phoneme_embedding = nn.Embedding(
            num_embeddings=num_phonemes, 
            embedding_dim=hidden_dim
        )
        
        self.stress_embedding = nn.Embedding(
            num_embeddings=num_stress_levels, 
            embedding_dim=hidden_dim
        )

    def forward(self, phoneme_ids, stress_ids):
        phone_vecs = self.phoneme_embedding(phoneme_ids)
        stress_vecs = self.stress_embedding(stress_ids)
        
        final_vectors = phone_vecs + stress_vecs
        
        return final_vectors


embedder = RapVocalsEmbedding(hidden_dim=256)
learned_vectors = embedder(phoneme_tensor, stress_tensor)

print(f"Original ID shape: {phoneme_tensor.shape}")
print(f"New Learned Vector shape: {learned_vectors.shape}")