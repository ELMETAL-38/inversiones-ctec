import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [loans, contracts] = await Promise.all([
      base44.asServiceRole.entities.Loan.list(),
      base44.asServiceRole.entities.Contract.list(),
    ]);

    const contractLoanIds = new Set(contracts.map(c => c.loan_id));
    const missingLoans = loans.filter(l => !contractLoanIds.has(l.id));

    let created = 0;
    for (const loan of missingLoans) {
      try {
        await base44.asServiceRole.entities.Contract.create({
          loan_id: loan.id,
          client_id: loan.client_id,
          client_name: loan.client_name,
          loan_amount: loan.amount,
          total_to_pay: loan.total_to_pay,
          start_date: loan.start_date,
          due_date: loan.due_date,
          interest_rate: loan.interest_rate,
          interest_type: loan.interest_type,
          num_installments: loan.num_installments,
          printed_at: new Date().toISOString().split('T')[0],
        });
        created++;
      } catch (err) {
        console.error(`Error creando contrato para préstamo ${loan.id}:`, err.message);
      }
    }

    return Response.json({ success: true, created, total_missing: missingLoans.length });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});