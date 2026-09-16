try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-1.5-flash",
        "messages": [
          { "role": "user", "content": promptEspecialista }
        ],
        "temperature": 0.2 
      })
    });

    const data = await response.json();

    // 🚨 NOVA TRAVA DE SEGURANÇA AQUI 🚨
    if (data.error) {
      console.error("MOTIVO DO ERRO NO OPENROUTER:", data.error);
      return res.status(500).json({ erro: 'Bloqueio na IA: ' + data.error.message });
    }

    let textoResposta = data.choices[0].message.content;
    textoResposta = textoResposta.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const analiseJSON = JSON.parse(textoResposta);
    res.status(200).json(analiseJSON);

  } catch (error) {
    console.error("Erro na API:", error);
    res.status(500).json({ erro: 'Não foi possível realizar a equiparação no momento.' });
  }
