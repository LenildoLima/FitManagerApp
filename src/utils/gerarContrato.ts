import jsPDF from 'jspdf';
import { Aluno, Plano } from '@/types/database';
import { formatarMoeda, formatarCPF, formatarTelefone } from './formatters';

export const gerarContrato = (aluno: Partial<Aluno>, plano: Partial<Plano>) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Helpers
  const addText = (text: string, x: number, yPos: number, size = 10, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(text, x, yPos);
  };

  const addLine = () => {
    y += 10;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  };

  const addWrappedText = (text: string, x: number, yPos: number, maxWidth: number, size = 10) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, yPos);
    return lines.length * (size * 0.5);
  };

  // 1. Cabeçalho
  addText('FitManager', pageWidth / 2, y, 22, true);
  doc.text('', pageWidth / 2, y, { align: 'center' }); // Just to center the previous one
  y += 10;
  addText('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, y, 14, true);
  y += 15;

  // Data de emissão
  const hoje = new Date().toLocaleDateString('pt-BR');
  addText(`Data de Emissão: ${hoje}`, pageWidth - 60, 20, 10);

  // 2. CONTRATANTE
  addText('1. CONTRATANTE', margin, y, 12, true);
  y += 8;
  addText(`Nome: ${aluno.nome || '____________________________________'}`, margin, y);
  y += 6;
  addText(`CPF: ${aluno.cpf ? formatarCPF(aluno.cpf) : '____.____.____-____'}`, margin, y);
  addText(`RG: ${aluno.rg || '____________'}`, margin + 80, y);
  y += 6;
  addText(`Nascimento: ${aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR') : '____/____/____'}`, margin, y);
  y += 6;
  addText(`Endereço: ${aluno.logradouro || ''}, ${aluno.numero || ''} - ${aluno.bairro || ''}`, margin, y);
  y += 6;
  addText(`Cidade/UF: ${aluno.cidade || ''} / ${aluno.estado || ''}`, margin, y);
  addText(`CEP: ${aluno.cep || ''}`, margin + 80, y);
  y += 6;
  addText(`Telefone: ${formatarTelefone(aluno.celular || aluno.telefone || '')}`, margin, y);
  addText(`E-mail: ${aluno.email || ''}`, margin + 80, y);
  y += 12;

  // 3. SERVIÇOS CONTRATADOS
  addText('2. SERVIÇOS CONTRATADOS', margin, y, 12, true);
  y += 8;
  addText(`Plano: ${plano.nome || 'Não informado'}`, margin, y);
  addText(`Duração: ${plano.duracao || 'N/A'}`, margin + 80, y);
  y += 6;
  addText(`Valor Mensal: ${plano.valor ? formatarMoeda(plano.valor) : 'R$ 0,00'}`, margin, y);
  addText(`Acessos por dia: ${plano.acessos_por_dia || 'Ilimitado'}`, margin + 80, y);
  y += 6;
  addText(`Data de Início: ${aluno.data_inicio_plano ? new Date(aluno.data_inicio_plano).toLocaleDateString('pt-BR') : hoje}`, margin, y);
  addText(`Data de Vencimento: ${aluno.data_vencimento_plano ? new Date(aluno.data_vencimento_plano).toLocaleDateString('pt-BR') : 'Próximo mês'}`, margin + 80, y);
  y += 15;

  // 4. CLÁUSULAS
  addText('3. CLÁUSULAS', margin, y, 12, true);
  y += 8;

  const clausulas = [
    { t: 'CLÁUSULA PRIMEIRA - OBJETO', c: 'O presente contrato tem por objeto a prestação de serviços de condicionamento físico e atividades relacionadas, conforme modalidade e horários disponíveis na unidade conforme o plano contratado.' },
    { t: 'CLÁUSULA SEGUNDA - VIGÊNCIA E RENOVAÇÃO', c: 'Este contrato tem validade pelo período estipulado no plano contratado. A renovação ocorre mediante novo pagamento e assinatura de aditivo se necessário.' },
    { t: 'CLÁUSULA TERCEIRA - PAGAMENTO E MORA', c: 'O pagamento deve ser realizado até a data de vencimento. O atraso acarretará multa de 2% sobre o valor da parcela, acrescido de juros de mora de 1% ao mês.' },
    { t: 'CLÁUSULA QUARTA - CANCELAMENTO', c: 'O cancelamento poderá ser solicitado com aviso prévio mínimo de 30 (trinta) dias. Eventuais multas rescisórias serão aplicadas conforme regulamento vigente da unidade.' },
    { t: 'CLÁUSULA QUINTA - RESPONSABILIDADE', c: 'O CONTRATANTE declara gozar de plena saúde e assume total responsabilidade por sua condição física para a prática de exercícios, isentando a FitManager de intercorrências por omissão de histórico médico.' },
    { t: 'CLÁUSULA SEXTA - POLÍTICA DE USO', c: 'O CONTRATANTE obriga-se a respeitar as normas internas da academia, incluindo horários, vestimenta adequada e uso zeloso dos equipamentos.' }
  ];

  clausulas.forEach(item => {
    addText(item.t, margin, y, 9, true);
    y += 5;
    const height = addWrappedText(item.c, margin, y, pageWidth - (margin * 2), 9);
    y += height + 5;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  });

  y += 10;

  // 5. RODAPÉ / ASSINATURA
  addText(`${aluno.cidade || 'Local'}, ${hoje}`, margin, y);
  y += 25;

  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 70, y);
  doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);
  
  y += 5;
  addText('Academia FitManager', margin + 35 - doc.getTextWidth('Academia FitManager') / 2, y, 10);
  addText('Contratante', pageWidth - margin - 35 - doc.getTextWidth('Contratante') / 2, y, 10);
  
  y += 6;
  doc.setFontSize(8);
  addText('Assinatura do Responsável', margin + 35 - doc.getTextWidth('Assinatura do Responsável') / 2, y);
  addText(aluno.nome || 'Assinatura do Aluno', pageWidth - margin - 35 - doc.getTextWidth(aluno.nome || 'Assinatura do Aluno') / 2, y);

  doc.save(`contrato_${aluno.nome?.replace(/\s+/g, '_') || 'aluno'}.pdf`);
};
