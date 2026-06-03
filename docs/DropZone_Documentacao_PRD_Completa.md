# DropZone - Documentacao PRD Completa

## 1. Escolha do Sistema

**Nome do sistema:** DropZone - Sistema de Gestao de Achados e Perdidos.

**Tipo de sistema:** Aplicacao web para controle institucional de itens perdidos, encontrados, solicitados para coleta e devolvidos.

**Justificativa da escolha:**
O controle de achados e perdidos em ambientes academicos costuma ser manual, pouco rastreavel e dependente de comunicacao informal. O DropZone centraliza o processo, facilita a busca por itens e cria um fluxo seguro de devolucao com codigo unico, auditoria e controle por perfil.

**Objetivo principal:**
Permitir que usuarios encontrem, registrem e acompanhem itens perdidos ou encontrados de forma organizada, segura e auditavel.

**Problema resolvido:**
- Falta de controle centralizado de itens perdidos.
- Dificuldade para usuarios localizarem itens encontrados.
- Risco de entrega para pessoa errada.
- Ausencia de historico confiavel de devolucoes.
- Falta de transparencia para administradores e usuarios.

**Solucao proposta:**
Uma plataforma web integrada com frontend, backend e banco de dados remoto, permitindo cadastro, consulta, solicitacao de coleta, confirmacao de devolucao, auditoria e comunicacao P2P.

## 2. Stakeholders

**Usuario base**
- Perfil: aluno, servidor ou pessoa vinculada a instituicao.
- Interesse: consultar itens, registrar perdas, solicitar coleta e acompanhar solicitacoes.
- Necessidade principal: encontrar ou recuperar um item com rapidez e seguranca.

**Administrador**
- Perfil: pessoa responsavel pelo setor de achados e perdidos.
- Interesse: cadastrar itens encontrados, editar informacoes e confirmar devolucoes.
- Necessidade principal: controlar o fluxo operacional de itens e evitar entregas incorretas.

**Superusuario**
- Perfil: responsavel geral pelo sistema.
- Interesse: gerenciar usuarios, administradores, logs e relatorios.
- Necessidade principal: manter governanca, seguranca e rastreabilidade.

**Instituicao / Campus**
- Perfil: entidade que utiliza o sistema.
- Interesse: organizar processos internos e melhorar atendimento.
- Necessidade principal: reduzir perdas, conflitos e falta de informacao.

**Equipe tecnica**
- Perfil: desenvolvedores e mantenedores.
- Interesse: manter frontend, backend, banco e deploy funcionando.
- Necessidade principal: garantir estabilidade, seguranca e evolucao do sistema.

**Professor / avaliador**
- Perfil: responsavel pela avaliacao academica.
- Interesse: verificar prototipo, documentacao, requisitos e MVP.
- Necessidade principal: identificar se o projeto atende aos criterios solicitados.

## 3. Necessidades dos Usuarios

**Necessidades do usuario base**
- Criar conta e acessar o sistema.
- Consultar itens encontrados e perdidos.
- Filtrar itens por nome, categoria, local e status.
- Visualizar imagens e detalhes dos itens.
- Registrar um item perdido.
- Receber sugestoes de itens parecidos por pre-match.
- Solicitar coleta usando a opcao "E meu item".
- Receber codigo unico de coleta.
- Acompanhar solicitacoes em uma tela propria.
- Conversar com outro usuario via P2P quando alguem encontrar um item.

**Necessidades do administrador**
- Cadastrar itens encontrados.
- Editar informacoes de itens.
- Confirmar coleta por codigo unico.
- Consultar itens aguardando coleta.
- Consultar itens entregues.
- Ver historico operacional.
- Evitar entregas incorretas.

**Necessidades do superusuario**
- Criar administradores.
- Promover administradores para superusuario.
- Excluir usuarios comuns ou administradores.
- Consultar logs detalhados.
- Acessar relatorios P2P.
- Exportar dados para analise.
- Garantir seguranca e controle de acesso.

## 4. Requisitos Funcionais

### Autenticacao e Cadastro
- O sistema deve permitir login por email e senha.
- O sistema deve permitir cadastro de usuario base.
- O cadastro deve exigir nome, email, CPF, matricula, senha e confirmacao de senha.
- O sistema deve validar campos obrigatorios.
- O sistema deve permitir upload de foto de perfil.
- O sistema deve exigir aceite de LGPD.
- O sistema deve permitir mostrar e ocultar senha.
- O sistema deve redirecionar o usuario para a home apos cadastro/login.
- O sistema deve impedir acesso a rotas privadas sem autenticacao.
- O sistema deve realizar logout por inatividade.

### Home / Vitrine
- O sistema deve listar itens cadastrados.
- O sistema deve exibir imagem, nome, categoria, local, data, descricao e status.
- O sistema deve permitir busca por nome.
- O sistema deve permitir filtros por categoria, local e status.
- O sistema deve permitir ordenacao cronologica.
- O sistema deve exibir mensagem quando nenhum item for encontrado.
- O sistema deve permitir ampliar imagens.
- O sistema deve diferenciar visualmente itens devolvidos.

### Cadastro de Itens Encontrados
- Apenas administradores e superusuarios podem cadastrar itens encontrados.
- O cadastro deve incluir nome, descricao, categoria, local, data, turno e imagens.
- O campo local deve permitir opcao "Outros".
- O sistema deve permitir adicionar multiplas imagens.
- O sistema deve permitir edicao de dados do item.
- O sistema deve impedir alteracao manual indevida de status sensiveis.
- O sistema deve permitir exclusao de item por perfil autorizado.

### Registro de Item Perdido
- Usuario base deve poder registrar um item perdido.
- O formulario deve conter nome, categoria, data, turno, local provavel, caracteristicas e imagens.
- O sistema deve impedir data futura.
- O sistema deve limitar o ano a quatro digitos.
- O sistema deve validar o turno conforme horario atual.
- O campo local provavel deve permitir opcao "Outros".
- O sistema deve realizar pre-match considerando descricao, categoria e local.
- Itens perdidos devem aparecer na vitrine.

### Minhas Solicitacoes
- Usuario base deve visualizar itens que cadastrou como perdidos.
- Usuario base deve visualizar itens marcados como "E meu item".
- O sistema deve mostrar codigo de coleta enquanto estiver ativo.
- O usuario dono do alerta deve poder marcar "Ja encontrei esse item".
- O sistema deve confirmar a acao antes de alterar status.
- O sistema deve informar quando o item ja foi devolvido a outra pessoa.

### Coleta e Devolucao
- Usuario base deve poder marcar um item como "E meu item".
- O sistema deve gerar codigo unico de seis caracteres.
- O codigo deve ser aleatorio, unico e de uso unico.
- Administrador ou superusuario deve confirmar coleta informando o codigo.
- O sistema deve carregar automaticamente os dados do solicitante.
- Apos confirmacao, o item deve ser marcado como devolvido.
- Codigos pendentes do mesmo item devem ser cancelados.
- O sistema deve salvar relatorio da entrega.

### Gestao de Usuarios
- Administradores devem visualizar usuarios.
- Superusuario deve criar administradores.
- Superusuario deve excluir usuarios base ou administradores.
- Superusuario deve promover administrador para superusuario.
- O sistema deve exigir confirmacao para promocoes e exclusoes.
- Usuario base nao deve ver funcionalidades administrativas.

### Auditoria e Relatorios
- O sistema deve registrar logs de acoes importantes.
- Logs devem incluir usuario, acao, entidade, data e detalhes.
- Logs devem ser somente leitura.
- Administradores e superusuarios devem consultar logs.
- Superusuario deve ter acesso a detalhes mais completos.
- O sistema deve permitir exportacao de dados.

### P2P
- Usuario pode informar que encontrou um item perdido.
- O sistema deve abrir conversa entre quem perdeu e quem encontrou.
- O chat deve permitir mensagens de texto.
- O chat deve permitir upload de imagens.
- O chat deve mostrar nome, foto, leitura e presenca do usuario.
- O historico P2P deve ficar salvo.
- Somente superusuario deve acessar relatorios P2P completos.

## 5. Requisitos Nao Funcionais

**Tecnologias**
- Frontend em Next.js, React, TypeScript e Tailwind CSS.
- Backend em Node.js e Express.
- Banco de dados PostgreSQL via Supabase.
- API REST com Axios.
- Deploy do frontend na Vercel.
- Deploy do backend no Render.

**Seguranca**
- Autenticacao com JWT.
- Senhas criptografadas com bcrypt.
- Codigos sensiveis salvos com hash.
- Controle de acesso por perfil: user, admin e super.
- RLS habilitado no Supabase.
- CORS e Helmet configurados.
- Sanitizacao basica de entrada.
- Tratamento global de erros.
- CPF mascarado no perfil.
- Logout automatico por inatividade.

**Usabilidade**
- Interface responsiva para desktop e mobile.
- Tema claro e escuro.
- Feedback visual com toasts.
- Estados de carregamento.
- Modais de confirmacao.
- Navegacao com destaque da pagina atual.
- Cards visuais com imagens dos itens.

**Performance e disponibilidade**
- API hospedada em nuvem.
- Banco remoto Supabase.
- Frontend estatico/otimizado na Vercel.
- Timeout maior e retry para reduzir falhas de cold start no Render.

## 6. Regras de Negocio

- Usuario base pode consultar itens, registrar perdas e solicitar coleta.
- Usuario base nao pode cadastrar ou editar itens encontrados.
- Administrador pode cadastrar, editar e gerenciar itens encontrados.
- Administrador pode confirmar coleta usando codigo.
- Superusuario pode criar administradores.
- Superusuario pode promover administradores para superusuarios.
- Superusuario pode excluir usuarios base e administradores.
- Administrador nao pode criar outro administrador.
- Codigo de coleta deve ser unico.
- Codigo de coleta so pode ser usado uma vez.
- Item devolvido nao pode ser coletado novamente.
- Quando um item e devolvido, outras solicitacoes pendentes sao canceladas.
- Logs de auditoria nao podem ser alterados ou apagados.
- Relatorios P2P completos so podem ser vistos por superusuario.
- Dados sensiveis devem ser protegidos e exibidos com mascara quando necessario.

## 7. Modelo de Dados

### usuarios
Armazena os usuarios do sistema.

Campos principais:
- id
- nome
- email
- senha
- role
- cpf
- matricula
- foto_url
- last_seen
- criado_em

Relacionamentos:
- Um usuario pode cadastrar varios itens.
- Um usuario pode criar varias solicitacoes de perdido.
- Um usuario pode ter varias coletas.
- Um usuario pode participar de conversas P2P.
- Um usuario pode gerar logs de auditoria.

### itens
Armazena itens achados, perdidos, aguardando coleta ou devolvidos.

Campos principais:
- id
- nome_item
- descricao
- categoria
- local_encontrado
- data_achado
- turno
- status
- imagem_url
- imagens_urls
- cadastrado_por_id
- data_entrega
- criado_em
- atualizado_em

Relacionamentos:
- Um item pertence a um usuario cadastrador.
- Um item pode ter solicitacoes de coleta.
- Um item pode gerar entrega.
- Um item pode participar de conversa P2P.

### solicitacoes_perdidos
Armazena alertas de itens perdidos.

Campos principais:
- id
- usuario_id
- item_id
- nome_item
- categoria
- data_perda
- turno
- local_provavel
- caracteristicas
- imagem_url
- status

### coletas_itens
Armazena codigos e solicitacoes de coleta.

Campos principais:
- id
- item_id
- usuario_id
- codigo_coleta
- codigo_coleta_hash
- status
- criado_em
- usado_em
- cancelado_em

### entregas_itens
Armazena relatorios de devolucao.

Campos principais:
- id
- item_id
- usuario_solicitante_id
- entregue_por_id
- coletor_nome
- coletor_documento
- coletor_email
- detalhes_item
- criado_em

### p2p_conversas
Armazena conversas entre quem perdeu e quem encontrou um item.

Campos principais:
- id
- item_id
- dono_id
- encontrado_por_id
- codigo_entrega
- codigo_entrega_hash
- status
- criado_em
- atualizado_em
- entregue_em

### p2p_mensagens
Armazena mensagens do chat P2P.

Campos principais:
- id
- conversa_id
- usuario_id
- texto
- imagem_url
- lida_em
- criado_em

### auditoria_logs
Armazena historico imutavel de acoes importantes.

Campos principais:
- id
- usuario_id
- acao
- entidade
- entidade_id
- detalhes
- criado_em

## 8. MVP

**MVP entregue**
- Login e cadastro de usuarios.
- Protecao de rotas.
- Home com vitrine de itens.
- Busca e filtros.
- Cadastro de item encontrado por administrador/superusuario.
- Cadastro de item perdido por usuario base.
- Minhas solicitacoes.
- Geracao de codigo unico de coleta.
- Confirmacao de coleta por administrador/superusuario.
- Relatorio de itens entregues.
- Gestao de usuarios.
- Auditoria.
- Chat P2P.
- Tema claro/escuro.
- Interface responsiva.
- Deploy em Vercel, Render e Supabase.

**Mobile**
- O frontend foi construido com layout responsivo.
- Telas principais adaptam-se para telas menores.
- Navbar, cards, formularios e modais foram pensados para uso em celular.
- Para comprovar na entrega, recomenda-se anexar prints mobile das telas:
  - Login.
  - Home.
  - Perdi um item.
  - Minhas solicitacoes.

## 9. Documentacao PRD

**Documento PRD inclui:**
- Nome do produto.
- Objetivo.
- Problema.
- Solucao.
- Stakeholders.
- Necessidades dos usuarios.
- Requisitos funcionais.
- Requisitos nao funcionais.
- Regras de negocio.
- Modelo de dados.
- MVP.
- Proximos passos.

**Artefatos gerados para entrega:**
- DropZone_PRD_Quadro_Completo.png
- DropZone_PRD_Quadro_Completo.pdf
- DropZone_Documentacao_PRD_Completa.md

## 10. Proximos Passos

- Adicionar notificacoes por email ou push.
- Implementar chat em tempo real com WebSocket.
- Criar dashboard analitico com graficos.
- Usar storage externo dedicado para imagens.
- Criar testes automatizados end-to-end.
- Transformar frontend em PWA.
- Ampliar rotina de retencao e anonimização LGPD.

## 11. Checklist Final da Atividade

- Escolha do sistema: cumprido.
- Stakeholders: cumprido neste documento.
- Necessidades dos usuarios: cumprido neste documento.
- Requisitos funcionais: cumprido neste documento.
- Requisitos nao funcionais: cumprido neste documento.
- Regras de negocio: cumprido neste documento.
- Modelo de dados: cumprido neste documento.
- MVP com mobile: cumprido, com recomendacao de anexar prints.
- Documentacao PRD: cumprida.
