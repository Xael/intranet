
import { LicitacaoDetalhada, StatusLicitacaoDetalhada } from '../types';

// Dados de licitação existentes fornecidos pelo usuário para pré-carregar a aplicação.
export const initialBids: { bids: LicitacaoDetalhada[] } = {
  "bids": [
    {
      "bidNumber": "EDITAL N° 90032/2025",
      "city": "AUTODROMO INTERLAGOS - ROÇAGEM",
      "companyName": "CRB",
      "id": "1761247277074",
      "lastUpdated": "2025-10-23T19:25:21.843Z",
      "placement": "",
      "platformLink": "https://cnetmobile.estaleiro.serpro.gov.br/",
      "progressForecast": "COMEÇARÁ AS 10:30",
      "realizationDate": "2025-10-29",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.EM_ANDAMENTO
    },
    {
      "bidNumber": "EDITAL Nº 66/2025",
      "city": "BARIRI - DIVERSOS MATERIAIS",
      "companyName": "AFC",
      "id": "1761247016885",
      "lastUpdated": "2025-10-24T14:51:37.833Z",
      "placement": "",
      "platformLink": "https://bllcompras.com/",
      "progressForecast": "NÃO VENCEU NENHUM LOTE",
      "realizationDate": "2025-10-24",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.EM_ANDAMENTO
    },
    {
      "bidNumber": "EDITAL Nº 30/2025",
      "city": "IGARATA - ROÇAGEM",
      "companyName": "CRB",
      "id": "1761247147907",
      "lastUpdated": "2025-10-24T14:51:07.241Z",
      "placement": "17° LUGAR",
      "platformLink": "https://bnccompras.com/",
      "progressForecast": "INTERPOSIÇÃO DE RECURSOS - AGUARDAM O PRAZO",
      "realizationDate": "2025-10-23",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.EM_ANDAMENTO
    },
    {
      "bidNumber": "EDITAL Nº 097/2025 - Nº 078/2025 - Nº 130/2025",
      "city": "ITAPUÍ - MATERIAL 2",
      "companyName": "AFC",
      "id": "1760102053346",
      "lastUpdated": "2025-10-10T15:20:14.332Z",
      "placement": "1°",
      "platformLink": "http://itapui.ddns.net:8079/comprasedital/",
      "progressForecast": "17/10/2025 - RETORNARÁ PARA VERIFICAR DOCUMENTAÇÃO",
      "realizationDate": "2025-10-09",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.EM_ANDAMENTO
    },
    {
      "bidNumber": "Nº 014/2025 PROCESSO Nº 023/2025",
      "city": "ITAPEVI - CAFÉ",
      "companyName": "AFC",
      "id": "1759239212427",
      "lastUpdated": "2025-10-15T14:45:57.753Z",
      "placement": "3°",
      "platformLink": "https://sala.bbmnet.com.br/home/meuslotes",
      "progressForecast": "Homologando 14/10/2025",
      "realizationDate": "2025-09-29",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.EM_ANDAMENTO
    },
    {
      "bidNumber": "Pregão Eletrônico N° 90017/2025",
      "city": "SP - ROÇAGEM",
      "companyName": "CRB",
      "id": "1760102446699",
      "lastUpdated": "2025-10-20T11:30:21.398Z",
      "placement": "18°",
      "platformLink": "https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/seguro/fornecedor/acompanhamento-compra?compra=10010205900172025",
      "progressForecast": "SELEÇÃO DE FORNECEDORES",
      "realizationDate": "2025-10-09",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.ENCERRADA
    },
    {
      "bidNumber": "90210/2025",
      "city": "BOTUCATU - TINTAS",
      "companyName": "AFC",
      "id": "1759258982219",
      "lastUpdated": "2025-10-10T13:17:35.754Z",
      "placement": "?",
      "platformLink": "https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/seguro/fornecedor/compras?compra=",
      "progressForecast": "09/10/2025",
      "realizationDate": "2025-08-12",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.ENCERRADA
    },
    {
      "bidNumber": "117/25",
      "city": "ITAPUÍ - BLOCOS",
      "companyName": "AFC",
      "id": "1759259588387",
      "lastUpdated": "2025-10-01T18:44:17.778Z",
      "placement": "2°",
      "platformLink": "http://itapui.ddns.net:8079/comprasedital/",
      "progressForecast": "Licitação falhou e será republicada. Sem data prevista.",
      "realizationDate": "2025-10-01",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.ENCERRADA
    },
    {
      "bidNumber": "078/2025",
      "city": "TREMEMBÉ - ROÇAGEM",
      "companyName": "CRB",
      "id": "1759258692888",
      "lastUpdated": "2025-09-30T19:14:38.099Z",
      "placement": "6°",
      "platformLink": "https://sala.bbmnet.com.br/home/meuslotes",
      "progressForecast": "",
      "realizationDate": "2025-08-12",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.ENCERRADA
    },
    {
      "bidNumber": "90038/2025",
      "city": "CENTRO DE INTENDÊNCIA TECNO.DA MARINHA SP - ROÇAGEM",
      "companyName": "CRB",
      "id": "1759259344603",
      "lastUpdated": "2025-09-30T19:14:21.475Z",
      "placement": "27°",
      "platformLink": "https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/seguro/fornecedor/compras?compra=",
      "progressForecast": "",
      "realizationDate": "2025-08-12",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.ENCERRADA
    },
    {
      "bidNumber": "16/2025",
      "city": "ASSIS",
      "companyName": "CRB",
      "id": "1759344094098",
      "lastUpdated": "2025-10-01T18:41:34.096Z",
      "placement": "",
      "platformLink": "https://scpi.assis.sp.gov.br:8079/compraseditala/",
      "progressForecast": "",
      "realizationDate": "2025-08-20",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.ENCERRADA
    },
    {
      "bidNumber": "070/2025",
      "city": "IBITINGA",
      "companyName": "AFC",
      "id": "1759412383056",
      "lastUpdated": "2025-10-02T13:39:43.056Z",
      "placement": "",
      "platformLink": "http://164.163.52.93:8079/comprasedital/",
      "progressForecast": "",
      "realizationDate": "2025-09-29",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.ENCERRADA
    },
    {
      "bidNumber": "010/2025 – PROCESSO Nº706/2025",
      "city": "ELIAS FAUSTO - ROÇAGEM",
      "companyName": "CRB",
      "id": "1759239410604",
      "lastUpdated": "2025-10-01T18:42:55.450Z",
      "placement": "5°",
      "platformLink": "https://sala.bbmnet.com.br/home/meuslotes",
      "progressForecast": "Aguardando documentos da 6° colocada.",
      "realizationDate": "2025-08-28",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.DESCLASSIFICADA
    },
    {
      "bidNumber": "139/2025",
      "city": "Prefeitura Municipal de Santana de Parnaíba - ROÇAGEM",
      "companyName": "CRB",
      "id": "1759241057590",
      "lastUpdated": "2025-10-10T15:18:33.923Z",
      "placement": "DESCLASSIFICADO",
      "platformLink": "https://operacao.portaldecompraspublicas.com.br/",
      "progressForecast": "10/10/2025 HOMOLOGADO",
      "realizationDate": "2025-08-18",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.DESCLASSIFICADA
    },
    {
      "bidNumber": "90017/2025",
      "city": "PMSP - INTERLAGOS - ROÇAGEM",
      "companyName": "CRB",
      "id": "1759259134163",
      "lastUpdated": "2025-10-20T11:29:52.393Z",
      "placement": "5°",
      "platformLink": "https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/seguro/fornecedor/compras?compra=",
      "progressForecast": "LICITAÇÃO ANULADA - SOLICITADO REEMBOLSO DA GARANTIA",
      "realizationDate": "2025-08-12",
      // FIX: Used enum member for type safety.
      "status": StatusLicitacaoDetalhada.DESCLASSIFICADA
    }
  ]
}