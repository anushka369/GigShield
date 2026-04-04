"""
Notification service — print-based stubs.
In production these would dispatch SMS via Twilio / push via FCM.
"""


def notify_worker_claim_created(worker, claim) -> None:
    print(
        f"[NOTIFY] Worker {worker.name} ({worker.phone}): "
        f"Claim {claim.id} created — {claim.claim_type} | "
        f"amount=Rs{float(claim.amount):.2f} | status={claim.status}"
    )


def notify_worker_claim_approved(worker, claim, payout) -> None:
    print(
        f"[NOTIFY] Worker {worker.name} ({worker.phone}): "
        f"Claim APPROVED — Rs{float(claim.amount):.2f} sent to {worker.upi_id} "
        f"(ref={payout.razorpay_ref})"
    )


def notify_admin_manual_review(claim) -> None:
    print(
        f"[NOTIFY] Admin: Claim {claim.id} needs manual review — "
        f"fraud_score={claim.fraud_score} bas_score={claim.bas_score} "
        f"flags={claim.fraud_flags}"
    )
