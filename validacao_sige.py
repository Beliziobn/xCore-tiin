"""
Módulo de Validação e Preenchimento do SIGE 2024/2025
República de Angola - Ministério da Educação / GEPE

Implementa a função padrão:
    processar_com_validacao(caminho_modelo, dados, caminho_saida, bloquear_se_erro=True)
"""

import json
import os
import subprocess
import sys
import tempfile

def processar_com_validacao(caminho_modelo, dados, caminho_saida="saida.xlsx", bloquear_se_erro=True):
    """
    Processa e preenche o Instrumento Oficial SIGE 2024/2025 com validação prévia.
    
    Parâmetros:
      - caminho_modelo (str): Caminho para o ficheiro XLSX modelo (ex: 'Instrumento_Complementar  ANUAL _.xlsx'
        ou 'Instrumento_Complementar_SIGE_2024_2025.xlsx')
      - dados (dict): Estrutura JSON com cobertura das secções do SIGE:
            meta, pre_escolar, iniciacao, primario_regular, praeer, eja_primario,
            sec1_geral, sec1_tecnico, sec1_eja, sec2_geral, sec2_tecnico, sec2_formacao,
            docentes, infraestruturas, aproveitamento, repetentes, nee, nao_docente
      - caminho_saida (str): Ficheiro XLSX a gerar
      - bloquear_se_erro (bool): Se True, levanta ValueError em caso de inconsistência matemática ou F > MF.
    
    Retorna:
      - dict com resumo do preenchimento e status de validação.
    """
    # Localizar ficheiro do motor JS
    base_dir = os.path.dirname(os.path.abspath(__file__))
    engine_path = os.path.join(base_dir, "scripts", "sige_fill_engine.js")
    if not os.path.exists(engine_path):
        engine_path = os.path.abspath("scripts/sige_fill_engine.js")

    # Criar ficheiro temporário para os dados JSON
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
        json.dump(dados, tf, ensure_ascii=False, indent=2)
        temp_json_path = tf.name

    try:
        cmd = [
            "node",
            engine_path,
            caminho_modelo,
            temp_json_path,
            caminho_saida,
            "true" if bloquear_se_erro else "false"
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, check=False)

        if result.returncode != 0:
            err_msg = result.stderr.strip() or result.stdout.strip()
            try:
                err_obj = json.loads(err_msg)
                err_msg = err_obj.get("erro", err_msg)
            except Exception:
                pass
            if bloquear_se_erro:
                raise ValueError(f"Erro no processamento do SIGE: {err_msg}")
            else:
                return {"sucesso": False, "erro": err_msg}

        # Parse output JSON
        stdout = result.stdout.strip()
        try:
            return json.loads(stdout)
        except Exception:
            return {
                "sucesso": True,
                "arquivo_gerado": caminho_saida,
                "detalhes": stdout
            }

    finally:
        if os.path.exists(temp_json_path):
            try:
                os.remove(temp_json_path)
            except Exception:
                pass

if __name__ == "__main__":
    print("Módulo validacao_sige carregado com sucesso.")
