# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web que permita enviar, listar e baixar documentos armazenados no filesystem local, mantendo seus metadados em memória e associando-os a um usuário de demonstração.

## 2. Escopo

### Dentro do escopo

- Enviar um documento por requisição usando `multipart/form-data`.
- Validar tipo e tamanho do arquivo antes de aceitá-lo.
- Listar os metadados dos documentos registrados no processo atual.
- Baixar um documento pelo identificador, usando o nome original no download.
- Associar cada documento a um identificador de usuário configurável para demonstração.
- Integrar o frontend React ao backend Express pelo proxy `/api` do Vite.

### Fora do escopo

- Autenticação real, autorização ou isolamento seguro entre usuários.
- Exclusão de documentos, busca, paginação ou versionamento.
- Banco de dados, armazenamento externo ou em nuvem.
- Reconstrução dos metadados após reiniciar o backend.
- Verificação antivírus ou transformação do conteúdo dos arquivos.

### Premissas

- A aplicação é um protótipo de usuário único: na ausência de autenticação, todas as requisições usam o mesmo `owner` configurado. A associação do metadado a um `owner` não restringe acesso; listagem e download não devem ser considerados protegidos.
- Os defaults propostos são limite de 10 MiB por arquivo e allowlist de PDF, DOCX e TXT. Ambos devem ser configuráveis por ambiente.
- O prefixo `/api` é usado pelo frontend no desenvolvimento. O proxy Vite o remove; o backend expõe as rotas sem esse prefixo.
- O armazenamento é local ao processo/aplicação e não deve depender de provedor externo.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento pelo campo `file` de uma requisição `multipart/form-data`. | Um upload válido cria um identificador único, grava o arquivo localmente e retorna os metadados com HTTP `201`. |
| RF-02 | O sistema valida o arquivo enviado. | Requisição sem arquivo retorna `400`; tipo não permitido retorna `415`; arquivo acima do limite retorna `413`. Nenhum desses casos deve deixar metadado ou arquivo parcial registrado. |
| RF-03 | O sistema registra os metadados do documento aceito. | O registro contém ID, nome original, tamanho em bytes, data/hora de upload e `owner`; falha ao registrar metadados após gravar o arquivo aciona limpeza do arquivo recém-criado. |
| RF-04 | O usuário pode listar documentos disponíveis no processo atual. | A resposta contém os metadados públicos dos documentos registrados em memória, sem caminho ou nome físico do arquivo. |
| RF-05 | O usuário pode baixar um documento pelo identificador. | Um ID existente retorna o conteúdo binário como anexo; ID inexistente retorna `404`. O nome original é usado no cabeçalho de download de forma segura. |
| RF-06 | O sistema mantém a associação do documento a um usuário de demonstração. | O `owner` vem de configuração, com default `demo-user`; como não há autenticação, não há filtragem nem garantia de isolamento por usuário. |

## 4. Requisitos não funcionais

| ID | Requisito | Critério/observação |
| --- | --- | --- |
| RNF-01 | Arquivos são armazenados somente no filesystem local por Multer com `diskStorage`. | O diretório default é `backend/storage`; o nome físico é gerado pelo sistema e não deriva diretamente do nome recebido. |
| RNF-02 | Metadados são mantidos em memória nesta fase. | O repositório em memória representa os documentos apenas durante a vida do processo. Não há persistência em banco nem recuperação automática no startup. |
| RNF-03 | Configuração segue o princípio 12-Factor. | Usar variáveis de ambiente para porta, diretório de armazenamento, limite de upload, tipos permitidos e ID do usuário de demonstração. |
| RNF-04 | Dados internos de armazenamento não são expostos pela API. | Caminhos locais e nomes físicos não aparecem em respostas nem em mensagens de erro. |
| RNF-05 | Erros são tratados nos limites do sistema. | Entrada inválida e falhas de filesystem/repositório são convertidas para respostas HTTP consistentes; detalhes internos não são enviados ao cliente. |
| RNF-06 | O frontend permanece independente dos detalhes de persistência. | A comunicação com o backend usa `fetch` pelo prefixo `/api`; mensagens visíveis ao usuário são apresentadas em português. |

### Configuração proposta

| Variável | Default | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local para os arquivos recebidos. |
| `MAX_UPLOAD_SIZE_MB` | `10` | Tamanho máximo por arquivo em MiB. |
| `ALLOWED_FILE_TYPES` | `application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain` | Tipos permitidos; validar também a extensão correspondente. |
| `DEFAULT_OWNER_ID` | `demo-user` | Valor atribuído ao campo `owner` nesta versão sem autenticação. |

A allowlist corresponde às extensões `.pdf`, `.docx` e `.txt`. O tipo MIME declarado pelo cliente não é, isoladamente, prova da natureza do conteúdo. A validação deve rejeitar extensões/tipos fora da política e não deve confiar em nomes de arquivo para formar caminhos.

## 5. Modelo de dados (metadados do documento)

### Metadados públicos

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único opaco, recomendado UUID. |
| `originalName` | string | Nome original fornecido para o arquivo, devolvido como metadado e nome de download. |
| `size` | number | Tamanho do arquivo em bytes, inteiro não negativo. |
| `uploadedAt` | string | Data/hora do recebimento em ISO 8601, normalizada para UTC. |
| `owner` | string | Identificador de usuário configurado; default `demo-user`, sem efeito de autorização nesta versão. |

### Dados internos de persistência

O repositório pode manter campos internos necessários para localizar e servir o arquivo, como nome físico gerado e tipo de conteúdo. Esses campos não fazem parte do modelo público e não podem ser retornados pela API. O nome físico deve ser independente de `originalName`; o caminho final deve permanecer dentro de `STORAGE_DIR`.

Os metadados ficam em uma estrutura em memória (por exemplo, um `Map` indexado por `id`). Ao reiniciar o processo, o índice é perdido. Arquivos já gravados podem permanecer no diretório, mas serão órfãos: não serão listados nem baixáveis e não haverá reconstrução automática nesta fase.

## 6. Contratos de API

As rotas abaixo são caminhos do backend. No frontend de desenvolvimento, chamá-las com `/api` na frente; o proxy Vite remove esse prefixo antes de encaminhar a requisição.

### Formato comum de erro

Todas as respostas de erro usam `application/json`:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo no campo file."
  }
}
```

O campo `code` é estável para consumo pelo frontend; `message` é uma mensagem segura em português. Não incluir stack trace, caminhos locais ou detalhes internos.

### `POST /upload`

- **Entrada:** `multipart/form-data`, um arquivo no campo obrigatório `file`.
- **Validações:** arquivo presente, extensão e tipo permitidos, limite de tamanho configurado.
- **Sucesso:** `201 Created`, `Content-Type: application/json`, corpo com o objeto de metadados público:

```json
{
  "id": "6b0d1ef0-9e7c-4c0c-9c2c-2d55d4c8c0f1",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-11-26T14:30:00.000Z",
  "owner": "demo-user"
}
```

- **Erros:** `400 FILE_REQUIRED` quando não há arquivo; `413 FILE_TOO_LARGE` quando excede o limite; `415 FILE_TYPE_NOT_ALLOWED` quando tipo/extensão não são permitidos; `500 STORAGE_ERROR` em falha de gravação ou persistência dos metadados.
- **Consistência:** se a gravação no filesystem for concluída, mas o registro dos metadados falhar, remover o arquivo gravado antes de responder.

### `GET /documents`

- **Entrada:** sem parâmetros ou corpo.
- **Sucesso:** `200 OK`, `Content-Type: application/json`, documentos registrados em memória, mais recentes primeiro:

```json
{
  "documents": [
    {
      "id": "6b0d1ef0-9e7c-4c0c-9c2c-2d55d4c8c0f1",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-11-26T14:30:00.000Z",
      "owner": "demo-user"
    }
  ]
}
```

- **Lista vazia:** retornar `200 OK` com `{"documents": []}`.
- **Erros:** `500 INTERNAL_ERROR` se não for possível obter a lista.
- A lista inclui todos os documentos do processo. Não há autenticação, autorização ou filtro efetivo por `owner` nesta versão.

### `GET /documents/:id/download`

- **Entrada:** ID opaco do documento no parâmetro `id`.
- **Sucesso:** `200 OK`, corpo binário, `Content-Disposition: attachment` com o nome original devidamente sanitizado e `Content-Type` correspondente ao tipo registrado. Incluir `Content-Length` quando disponível.
- **Erros:** `404 DOCUMENT_NOT_FOUND` se o ID não estiver no repositório em memória; `500 STORAGE_ERROR` se o arquivo registrado não puder ser lido.
- Não revelar caminho local ou nome físico nos cabeçalhos nem na resposta de erro.

### Códigos HTTP e de erro

| HTTP | `code` | Situação |
| --- | --- | --- |
| `400` | `FILE_REQUIRED` | Campo de arquivo ausente. |
| `413` | `FILE_TOO_LARGE` | Arquivo acima de `MAX_UPLOAD_SIZE_MB`. |
| `415` | `FILE_TYPE_NOT_ALLOWED` | Tipo ou extensão fora da allowlist. |
| `404` | `DOCUMENT_NOT_FOUND` | ID não cadastrado no processo atual. |
| `500` | `STORAGE_ERROR` | Falha ao gravar/ler arquivo ou atualizar repositório. |
| `500` | `INTERNAL_ERROR` | Falha inesperada não classificada. |

## 7. Decisões arquiteturais

- Backend em Node.js + Express, CommonJS, organizado em `routes/`, `controllers/`, `services/` e `repositories/`.
- Direção de dependência: `routes -> controllers -> services -> repositories`. Rotas definem endpoints e middleware; controllers traduzem HTTP e validam a entrada básica; services aplicam regras de negócio; repositories concentram operações de metadados e acesso ao armazenamento.
- Multer com `diskStorage` grava exclusivamente no filesystem local em `backend/storage` (ou `STORAGE_DIR`). O middleware de upload é ligado à rota; o tratamento da aplicação coordena a gravação com o registro de metadados e a compensação em caso de falha. Serviços não dependem de Express.
- Metadados em memória por meio de repositório; arquivos não são enviados a serviços externos. O ciclo de vida do processo limita a disponibilidade dos metadados.
- Frontend React com componentes funcionais e Hooks, organizado em componentes, páginas e serviços. A comunicação ocorre por `fetch` usando `/api`; o proxy de desenvolvimento já encaminha para o backend local.
- As rotas de documento descritas nesta especificação são requisitos futuros; o seed atual oferece apenas `GET /health`.

## 8. Plano de execução

Etapas futuras de implementação, fora do escopo da criação desta especificação:

1. Confirmar contratos, política de arquivos, variáveis de ambiente, respostas de erro e comportamento do `owner` de demonstração.
2. Implementar a configuração de Multer `diskStorage` para gravação local e o repositório de metadados em memória, incluindo limpeza em caso de falha.
3. Implementar regras de negócio no service e endpoints de upload, listagem e download nas camadas route/controller; cobrir validações, respostas e erros com testes backend.
4. Implementar no frontend o serviço de API e os componentes de upload, listagem e download, com estados de carregamento, lista vazia e erro.
5. Integrar frontend e backend pelo proxy Vite e validar os fluxos completos, incluindo limites de arquivo, download e comportamento após reinício.