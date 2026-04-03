from datetime import datetime

from sqlalchemy.orm import Session

from models.claim import Claim
from models.payout import Payout
from models.worker import Worker


def initiate(claim: Claim, db: Session) -> Payout:
    """
    Create a Payout record, call the Razorpay mock, and persist the result.
    Also updates claim status to 'approved' on success.
    """
    from integrations.razorpay_mock import initiate_transfer

    # Fetch worker for UPI ID
    worker = db.query(Worker).filter(Worker.id == claim.worker_id).first()
    upi_id = worker.upi_id if worker else "unknown@upi"

    result = initiate_transfer(upi_id, float(claim.amount), str(claim.id))

    success = result["status"] == "processed"
    payout = Payout(
        claim_id=claim.id,
        worker_id=claim.worker_id,
        amount=claim.amount,
        upi_id=upi_id,
        razorpay_ref=result.get("razorpay_ref"),
        status="completed" if success else "failed",
        completed_at=datetime.utcnow() if success else None,
        failure_reason=result.get("reason"),
    )
    db.add(payout)

    if success:
        claim.status = "approved"
    else:
        claim.status = "pending"
        claim.review_reason = f"Payout failed: {result.get('reason')}"

    db.commit()
    db.refresh(payout)

    if success and worker:
        from services.notification_service import notify_worker_claim_approved
        notify_worker_claim_approved(worker, claim, payout)

    return payout
