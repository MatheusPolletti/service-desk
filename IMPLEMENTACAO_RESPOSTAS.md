# Implementação de Respostas em Cadeia de Mensagens

## ✅ O que foi feito

A funcionalidade de respostas em cadeia (thread de mensagens) foi implementada no backend, permitindo que você responda a mensagens específicas e crie um histórico visual similar ao email.

### Mudanças Implementadas

#### 1. **Schema Prisma** (`schema.prisma`)

- Adicionado campo `parentMessageId` na model `Message`
- Criada relação auto-referenciada `MessageReplies` para vincular mensagens pai e filho
- Campo com cascade delete para manter integridade referencial

```prisma
model Message {
  // ... campos existentes
  parentMessageId  String?
  parentMessage    Message?     @relation("MessageReplies", fields: [parentMessageId], references: [id], onDelete: Cascade)
  replies          Message[]    @relation("MessageReplies")
}
```

#### 2. **Service** (`ticket.service.ts`)

- Método `addMessage()` agora:
  - Aceita `parentMessageId` do DTO
  - Vincula automaticamente a mensagem à sua resposta
  - Recupera o contexto correto de `inReplyTo` e `references`
  - Carrega dados de respostas e mensagem pai no retorno

- Método `getMessagesId()` melhorado para:
  - Incluir relacionamento de respostas em cada mensagem
  - Incluir informações da mensagem pai
  - Retornar estrutura hierárquica de threads

#### 3. **DTO** (`add.ticket.message.dto.ts`)

- Atualizado com validação UUID para `parentMessageId`
- Adiciona flag `status` opcional para alterar status do ticket ao responder

## 🎯 Como Usar

### Backend - API

**Criar uma resposta a uma mensagem específica:**

```bash
POST /ticket/add/message/:ticketId
Content-Type: application/json

{
  "content": "Sua resposta aqui",
  "notifyClient": true,
  "recipients": ["cliente@email.com"],
  "parentMessageId": "uuid-da-mensagem-pai",
  "status": "PENDING"  // opcional
}
```

**Exemplo com curl:**

```bash
curl -X POST http://localhost:5000/ticket/add/message/1 \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Respondendo sua pergunta",
    "notifyClient": true,
    "recipients": ["cliente@email.com"],
    "parentMessageId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Frontend - Comportamento

O componente `ticket-chat.tsx` já está preparado para:

1. **Exibir botão "Responder"** - clique para responder a uma mensagem
2. **Rastrear `parentMessageId`** - automaticamente enviado na requisição
3. **Atualizar conversa** - recarrega após enviar resposta
4. **Mostrar contexto** - indica quando está respondendo a uma mensagem

## 📊 Estrutura de Dados Retornada

Ao recuperar um ticket com `GET /ticket/get/message/:id`, a estrutura é:

```json
{
  "data": {
    "id": 1,
    "subject": "[Ticket #1] Assunto",
    "messages": [
      {
        "id": "uuid-1",
        "content": "Mensagem original",
        "direction": "IN",
        "parentMessageId": null,
        "parentMessage": null,
        "replies": [],
        "attachments": []
      },
      {
        "id": "uuid-2",
        "content": "Resposta à mensagem 1",
        "direction": "OUT",
        "parentMessageId": "uuid-1",
        "parentMessage": {
          /* dados da mensagem pai */
        },
        "replies": [],
        "attachments": []
      }
    ]
  },
  "success": true
}
```

## 🔄 Fluxo de Resposta

1. **Usuário clica "Responder" em uma mensagem**
   - Frontend captura `parentMessageId`
   - Estado `isReplying` é ativado

2. **Usuário escreve e envia a resposta**
   - Frontend envia POST com `parentMessageId`
   - Backend valida se mensagem pai existe

3. **Backend processa a resposta**
   - Cria nova Message com `parentMessageId` vinculado
   - Copia contexto de email (inReplyTo, references)
   - Envia notificação ao cliente se `notifyClient: true`
   - Atualiza status do ticket

4. **Frontend recarrega**
   - Exibe nova mensagem na conversa
   - Mantém histórico expandido
   - Limpa campo de resposta

## 🧪 Testando

### 1. Criar um ticket com mensagem inicial

```bash
curl -X POST http://localhost:5000/ticket/create \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Teste de Respostas",
    "content": "Mensagem inicial",
    "recipients": "cliente@email.com"
  }'
```

### 2. Adicionar resposta

```bash
curl -X POST http://localhost:5000/ticket/add/message/1 \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Primeira resposta",
    "notifyClient": true,
    "recipients": ["cliente@email.com"],
    "parentMessageId": "UUID_DA_MENSAGEM_ORIGINAL"
  }'
```

### 3. Responder à resposta (criar thread)

```bash
curl -X POST http://localhost:5000/ticket/add/message/1 \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Resposta à resposta",
    "notifyClient": true,
    "recipients": ["cliente@email.com"],
    "parentMessageId": "UUID_DA_PRIMEIRA_RESPOSTA"
  }'
```

### 4. Recuperar ticket com threads

```bash
curl http://localhost:5000/ticket/get/message/1 | jq '.data.messages'
```

## 🎨 Frontend - Próximas Melhorias (Opcional)

Para visualizar melhor as threads no frontend, considere:

1. **Indentar mensagens** quando são respostas
2. **Mostrar quote** da mensagem pai em mensagens filhas
3. **Expandir/recolher threads** por padrão
4. **Destacar visualmente** mensagens com respostas

Exemplo de estrutura visual:

```
┌─ Mensagem Original (19/02/2026 10:00)
│  │
│  └─► Resposta 1 (19/02/2026 10:15)
│  │
│  └─► Resposta 2 (19/02/2026 10:30)
│     │
│     └─► Resposta à Resposta 2 (19/02/2026 10:45)
│
└─ Outra Mensagem Original (19/02/2026 11:00)
```

## ✨ Benefícios

- ✅ **Email Threading**: Conversas organizadas como em email clients
- ✅ **Contexto Preservado**: Sabe qual mensagem está respondendo
- ✅ **Histórico Completo**: Todas as respostas no mesmo lugar
- ✅ **Compatibilidade**: Headers de email (In-Reply-To, References)
- ✅ **Escalável**: Suporta respostas infinitas em profundidade

## 📝 Notas

- O campo `direction` indica se é entrada ('IN') ou saída ('OUT')
- O email threading é baseado em padrões RFC 5322
- As migrações Prisma já foram aplicadas automaticamente
- O cliente Prisma foi regenerado com novos tipos

---

**Status**: ✅ Implementação Completa | **Data**: 11/02/2026
