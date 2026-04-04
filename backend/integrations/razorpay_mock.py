import random
from datetime import datetime
from uuid import uuid4


def initiate_transfer(upi_id: str, amount: float, claim_id: str) -> dict:
    """
    Simulate Razorpay Payout API response.
    95% success rate, 5% UPI timeout.
    """
    if random.random() > 0.05:
        return {
            "status": "processed",
            "razorpay_ref": f"mock_payout_{uuid4().hex[:12].upper()}",
            "utr": f"UTR{random.randint(100_000_000_000, 999_999_999_999)}",
            "amount": amount,
            "upi_id": upi_id,
            "processed_at": datetime.utcnow().isoformat(),
        }
    return {
        "status": "failed",
        "reason": "UPI_TIMEOUT",
        "amount": amount,
        "upi_id": upi_id,
    }
