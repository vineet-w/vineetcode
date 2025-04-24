
moves = ['rock', 'paper', 'scissors']
# win = +1, draw = 0, loss = -1
def outcome(p1, p2):
    if p1 == p2: return 0
    if (p1 == 'rock' and p2 == 'scissors') or \
       (p1 == 'paper' and p2 == 'rock') or \
       (p1 == 'scissors' and p2 == 'paper'):
        return 1
    return -1

def minimax():
    best_score = -2
    best_move = None
    for move in moves:
        worst_case = min(outcome(move, opp) for opp in moves)
        if worst_case > best_score:
            best_score = worst_case
            best_move = move
    return best_move

print("Best move to guarantee best outcome:", minimax())
