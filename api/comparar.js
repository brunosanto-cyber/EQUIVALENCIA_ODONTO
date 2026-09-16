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

  // 4. Prompt Estruturado de Alta Precisão
  const promptEspecialista = `
    Você é um Especialista de Produtos e Subscritor Sênior de Planos Odontológicos no Brasil.
    Sua missão é analisar o plano concorrente "${plano}" da operadora "${operadora}" (Modalidade: ${modelo}) 
    e mapear a EXATA equivalência para o portfólio da Unimed Odonto.

    ⚠️ TABELA DE REFERÊNCIA DE COBERTURAS UNIMED ODONTO ⚠️
    Use ESTRITAMENTE as regras abaixo para fazer o "match" da equiparação:

    1. PLANOS BÁSICOS (Rol ANS - Sem Manutenção Ortodôntica e Prótese Complexa):
    - "Essencial": Cobre o básico (Limpezas, Cáries, Extrações simples, Gengiva, Odontopediatria e Canal). Equipara com: Amil 200, OdontoPrev Integral, SulAmérica Odonto Mais.
    - "Essencial Plus": Essencial + Próteses unitárias simples em resina/cerômero.
    - "Essencial Plus DOC": Essencial Plus + Documentação Ortodôntica (exames e moldes para colocar aparelho, mas não a manutenção).

    2. PLANOS INTERMEDIÁRIOS (Próteses Ampliadas):
    - "Pleno": Cobre Essencial + extensões além do Rol.
    - "Pleno Plus": Pleno + próteses complementares.
    - "Pleno Plus DOC": Pleno Plus + Documentação Ortodôntica.

    3. PLANOS ORTODÔNTICOS E PREMIUM:
    - "Pleno Orto": OBRIGATÓRIO se o concorrente cobrir aparelho. Inclui Ortodontia Completa (Documentação + Instalação + Manutenções Ortodônticas Mensais). Equipara com: Amil 205 Orto, SulAmérica Orto.
    - "Pleno Top": Cobertura PREMIUM. Inclui Ortodontia Completa + Prótese Completa (Coroas de Porcelana, Dentaduras, Pontes). Equipara com: Amil 300, OdontoPrev Prótese.
    - "Plano Alinhador": O plano mais avançado. Cobre tudo do Pleno Top + Tratamento estético com Alinhadores Invisíveis.

    REGRAS DE DEDUÇÃO:
    - Se o nome do plano concorrente sugerir Ortodontia (ex: "Orto", "Aparelho"), a resposta OBRIGATÓRIA deve ser "Pleno Orto" ou superior.
    - Se sugerir Prótese complexa (ex: "Premium", "Porcelana", "300"), a resposta OBRIGATÓRIA é "Pleno Top".
    
    Retorne a sua resposta ÚNICA E EXCLUSIVAMENTE no formato JSON abaixo, sem blocos de código (markdown) e sem textos adicionais:
    {
      "plano_concorrente": "${plano}",
      "plano_unimed": "NOME EXATO DE UM DOS PLANOS DA TABELA ACIMA",
      "percentual_equiparacao": 95, 
      "coberturas_iguais": ["cobertura 1", "cobertura 2", "cobertura 3"],
      "coberturas_diferentes": ["cobertura A (Concorrente tem, Unimed não)", "cobertura B (Unimed tem, Concorrente não)"],
      "resumo_estrategico": "Seu argumento comercial persuasivo para o vendedor mostrar por que a Unimed Odonto é melhor, focando nos diferenciais do plano Unimed escolhido."
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
        "temperature": 0.1 // Temperatura super baixa (0.1) para que ela seja extremamente fria, lógica e siga a regra à risca.
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("MOTIVO DO ERRO NO OPENROUTER:", data.error);
      return res.status(500).json({ erro: 'Bloqueio na IA: ' + data.error.message });
    }

    // Tratamento de segurança da resposta JSON
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
    res.status(500).json({ erro: 'Não foi possível realizar a equiparação no momento. Tente novamente.' });
  }
}
