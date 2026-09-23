export default async function handler(req, res) {
  // 1. Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  const { operadora, modelo, plano } = req.body;

  if (!operadora || !modelo || !plano) {
    return res.status(400).json({ erro: 'Preencha todos os campos.' });
  }

  // 2. Base de Conhecimento Mapeada de Operadoras Concorrentes
  const baseDeReferencias = `
    === BASE DE REFERÊNCIA DAS OPERADORAS CONCORRENTES ===

    1. ODONTOPREV:
       - Integral DOC / Dente de Leite / PME Básico / Rol ANS: Equivalente -> "Essencial" ou "Essencial Plus DOC".
       - Orto / Ortodontia: Equiparações com manutenção ortodôntica -> "Pleno Orto".
       - Master / Prótese / Prótese Especial: Coberturas ampliadas de pontes/coroas -> "Pleno Top".

    2. DENTAL UNI:
       - Essencial / Padrão Rol / Class: Rol ANS básico -> "Essencial".
       - Orto VIP / Ortodontia: Cobre aparelhos e manutenções -> "Pleno Orto".
       - Elite / Prótese Total: Cobre pontes, coroas e porcelana -> "Pleno Top".

    3. SULAMÉRICA ODONTO:
       - Odonto Mais / Quali: Rol ANS com extensões simples -> "Essencial Plus".
       - Odonto Doc: Inclui documentação ortodôntica -> "Essencial Plus DOC".
       - Odonto Orto: Cobre manutenção de aparelhos -> "Pleno Orto".
       - Prestige / PME Executivo: Cobre prótese em porcelana/coroas -> "Pleno Top".

    4. AMIL DENTAL:
       - Dental 200 / 205: Rol ANS estendido -> "Essencial" ou "Essencial Plus".
       - Dental 205 Orto / Amil Orto: Cobre manutenção de aparelho -> "Pleno Orto".
       - Dental 300 / K40 / Prótese: Cobre pontes, coroas e próteses completas -> "Pleno Top".
       - Win / Alinhadores Transparentes: Cobre placas invisíveis -> "Plano Alinhador".

    5. BRADESCO ODONTO:
       - Ideal / Padrão Rol: Coberturas essenciais ANS -> "Essencial".
       - Max / Plus: Coberturas com pequenas próteses simples -> "Essencial Plus".
       - Ortoclass / Orto: Cobre aparelho fixo e manutenções -> "Pleno Orto".
       - Premium / Prótese: Cobre porcelana, coroas e pontes -> "Pleno Top".

    6. PORTO SEGURO ODONTO:
       - Odonto Bronze / Prata: Rol ANS básico ou com resina simples -> "Essencial" / "Essencial Plus".
       - Odonto Cristal / Orto: Cobre documentação e aparelho ortodôntico -> "Pleno Orto".
       - Odonto Ouro / Ouro Prótese: Cobre pontes e próteses completas -> "Pleno Top".

    7. METLIFE:
       - First / Gold: Rol ANS básico e emergência -> "Essencial".
       - Orto / Ortodontia: Cobre documentação, instalação e manutenções -> "Pleno Orto".
       - Diamond / Prótese: Cobre coroas e reconstruções em porcelana -> "Pleno Top".

    8. HAPVIDA ODONTO (Hapvida / Odonto System):
       - Mais Odonto / Padrão: Rol ANS básico -> "Essencial".
       - Hapvida Orto / Aparelho: Cobre manutenção de aparelho -> "Pleno Orto".
       - Hapvida Premium / Prótese: Cobre próteses e coroas -> "Pleno Top".

    9. INPAO DENTAL:
       - Linha Standard / Rol ANS: Apenas coberturas básicas da lei -> "Essencial".
       - Linha Orto / Ortodôntico: Cobre manutenção e documentação -> "Pleno Orto".
       - Linha Executiva / Master / Prótese: Cobre reconstrução com porcelana/coroas -> "Pleno Top".

    === PORTFÓLIO OFICIAL UNIMED ODONTO DISPONÍVEL ===
    Apenas estes nomes são permitidos para resposta:
    - Essencial
    - Essencial Plus
    - Essencial Plus DOC
    - Pleno
    - Pleno Plus
    - Pleno Plus DOC
    - Pleno Orto
    - Pleno Top
    - Plano Alinhador
  `;

  // 3. Prompt de Alta Precisão
  const promptEspecialista = `
    Você é um Especialista Sênior em Produtos e Equiparação de Planos Odontológicos no Brasil.
    Sua missão é analisar o plano concorrente "${plano}" da operadora "${operadora}" (Modalidade: ${modelo})
    e definir a EXATA equivalência comercial e técnica no portfólio da Unimed Odonto.

    Utilize estritamente a BASE DE REFERÊNCIA abaixo para fazer o cruzamento dos dados:
    ${baseDeReferencias}

    REGRAS DE EXECUÇÃO:
    1. Se o plano concorrente informado for das operadoras catalogadas acima, siga à risca o mapeamento fornecido.
    2. Se o concorrente for de outra operadora não catalogada, utilize dedução lógica pelas palavras-chave do nome do plano (ex: "Orto" -> Pleno Orto, "Prótese/Porcelana" -> Pleno Top, "Invisalign/Alinhador" -> Plano Alinhador).
    3. No campo "plano_unimed", insira EXATAMENTE o nome de um dos 9 planos oficiais listados.

    Retorne a sua resposta ÚNICA E EXCLUSIVAMENTE no formato JSON abaixo, sem blocos de código markdown ou texto extra:
    {
      "plano_concorrente": "${plano}",
      "plano_unimed": "NOME EXATO DO PLANO UNIMED SELECIONADO",
      "percentual_equiparacao": 90, 
      "coberturas_iguais": ["cobertura 1", "cobertura 2", "cobertura 3"],
      "coberturas_diferentes": ["cobertura A (Diferencial Concorrente/Unimed)", "cobertura B (Diferencial Unimed)"],
      "resumo_estrategico": "Argumento comercial persuasivo destacando os diferenciais da Unimed Odonto e por que o plano selecionado é o melhor substituto."
    }
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "openrouter/free", 
        "messages": [
          { "role": "user", "content": promptEspecialista }
        ],
        "temperature": 0.1 
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("MOTIVO DO ERRO NO OPENROUTER:", data.error);
      return res.status(500).json({ erro: 'Bloqueio na IA: ' + data.error.message });
    }

    let textoResposta = data.choices[0].message.content;
    textoResposta = textoResposta.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    const jsonInicio = textoResposta.indexOf('{');
    const jsonFim = textoResposta.lastIndexOf('}') + 1;
    if (jsonInicio !== -1 && jsonFim !== -1) {
        textoResposta = textoResposta.substring(jsonInicio, jsonFim);
    }
    
    const analiseJSON = JSON.parse(textoResposta);
    res.status(200).json(analiseJSON);

  } catch (error) {
    console.error("Erro na API:", error);
    res.status(500).json({ erro: 'Não foi possível realizar a equiparação no momento.' });
  }
}
