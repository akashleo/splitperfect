"""
Debt Simplification Service
Implements algorithm to minimize number of transactions needed to settle debts
"""
from typing import List, Dict, Tuple
from collections import defaultdict


class SimplifyService:
    @staticmethod
    def simplify_debts(balances: Dict[int, float]) -> List[Tuple[int, int, float]]:
        """
        Simplify debts to minimize number of transactions
        
        Args:
            balances: Dictionary mapping user_id to net balance
                     (positive = owed money, negative = owes money)
        
        Returns:
            List of tuples (from_user_id, to_user_id, amount)
        """
        # Separate creditors (positive balance) and debtors (negative balance)
        creditors = []  # People who are owed money
        debtors = []    # People who owe money
        
        for user_id, balance in balances.items():
            if balance > 0.01:  # Small threshold to handle floating point errors
                creditors.append([user_id, balance])
            elif balance < -0.01:
                debtors.append([user_id, -balance])  # Store as positive amount
        
        transactions = []
        
        # Sort by amount (largest first) for better optimization
        creditors.sort(key=lambda x: x[1], reverse=True)
        debtors.sort(key=lambda x: x[1], reverse=True)
        
        i, j = 0, 0
        
        while i < len(creditors) and j < len(debtors):
            creditor_id, credit_amount = creditors[i]
            debtor_id, debt_amount = debtors[j]
            
            # Settle the minimum of what's owed and what's due
            settle_amount = min(credit_amount, debt_amount)
            
            transactions.append((debtor_id, creditor_id, round(settle_amount, 2)))
            
            # Update balances
            creditors[i][1] -= settle_amount
            debtors[j][1] -= settle_amount
            
            # Move to next creditor/debtor if current one is settled
            if creditors[i][1] < 0.01:
                i += 1
            if debtors[j][1] < 0.01:
                j += 1
        
        return transactions
    
    @staticmethod
    def calculate_balances(room_id: int, db) -> Dict[int, float]:
        """
        Calculate net balance for each user in a room
        
        Args:
            room_id: Room ID
            db: Database session
            
        Returns:
            Dictionary mapping user_id to net balance
        """
        from models.bill import Bill, BillItem
        from models.room import Membership
        
        # Get all members in the room
        memberships = db.query(Membership).filter(Membership.room_id == room_id).all()
        member_ids = [m.user_id for m in memberships]
        
        # Initialize balances
        balances = defaultdict(float)
        for user_id in member_ids:
            balances[user_id] = 0.0
        
        # Get all bills in the room
        bills = db.query(Bill).filter(Bill.room_id == room_id).all()
        
        for bill in bills:
            # Track who paid
            balances[bill.uploaded_by] += bill.total_amount
            
            # Track who owes what
            for item in bill.items:
                if item.shared_by:
                    # Split item cost among people who shared it
                    split_amount = item.amount / len(item.shared_by)
                    for user_id in item.shared_by:
                        if user_id in balances:
                            balances[user_id] -= split_amount
        
        return dict(balances)


# Singleton instance
simplify_service = SimplifyService()
