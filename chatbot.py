# Copyright (c) Meta Platforms, Inc. and affiliates.
# This software may be used and distributed in accordance with the terms of the Llama 3 Community License Agreement.

from typing import List, Optional
import os
import fire
import torch
from llama import Dialog, Llama


def main(
    ckpt_dir: str = "/home/massimo-nodin/.llama/checkpoints/Llama3.2-1B-Instruct/",
    tokenizer_path: str = "/home/massimo-nodin/.llama/checkpoints/Llama3.2-1B-Instruct/tokenizer.model",
    temperature: float = 0.6,
    top_p: float = 0.9,
    max_seq_len: int = 8192,
    max_batch_size: int = 4,
    max_gen_len: Optional[int] = None,
):
    generator = Llama.build(
        ckpt_dir=ckpt_dir,
        tokenizer_path=tokenizer_path,
        max_seq_len=max_seq_len,
        max_batch_size=max_batch_size,
    )

    dialogs: List[Dialog] = [
        [{"role": "assistant", "content": "Hello, how can I help you today?"}],
    ]
    print("ChatBot: Hello, how can I help you today?")

    while True:
        try:
            textInput = input("You: ")
        except KeyboardInterrupt:
            break
        if textInput == "exit":
            break
        if textInput == "new":
            dialogs: List[Dialog] = [
                [{"role": "assistant", "content": "Hello, how can I help you today?"}],
            ]
            continue
        dialogs[0].append({"role": "user", "content": textInput})
        results = generator.chat_completion(
            dialogs,
            max_gen_len=max_gen_len,
            temperature=temperature,
            top_p=top_p,
        )
        dialogs[0].append({"role": "assistant", "content": results[-1]['generation']['content']})
        print(f"""ChatBot: {results[-1]['generation']['content']}""")

if __name__ == "__main__":
    fire.Fire(main)
