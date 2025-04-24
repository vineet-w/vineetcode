

import heapq

# Goal state
goal = [[1,2,3],[4,5,6],[7,8,0]]

# Heuristic: Manhattan Distance
def heuristic(state):
    distance = 0
    for i in range(3):
        for j in range(3):
            val = state[i][j]
            if val != 0:
                goal_x, goal_y = divmod(val - 1, 3)
                distance += abs(goal_x - i) + abs(goal_y - j)
    return distance

# Get possible moves
def get_neighbors(state):
    neighbors = []
    x, y = [(i,j) for i in range(3) for j in range(3) if state[i][j] == 0][0]
    moves = [(-1,0),(1,0),(0,-1),(0,1)]
    for dx, dy in moves:
        nx, ny = x + dx, y + dy
        if 0 <= nx < 3 and 0 <= ny < 3:
            new_state = [row[:] for row in state]
            new_state[x][y], new_state[nx][ny] = new_state[nx][ny], new_state[x][y]
            neighbors.append(new_state)
    return neighbors

# A* Search
def a_star(start):
    visited = set()
    queue = [(heuristic(start), 0, start, [])]  # (f, g, state, path)

    while queue:
        f, g, state, path = heapq.heappop(queue)
        state_tuple = tuple(tuple(row) for row in state)
        if state == goal:
            return path + [state]
        if state_tuple in visited:
            continue
        visited.add(state_tuple)
        for neighbor in get_neighbors(state):
            heapq.heappush(queue, (g + 1 + heuristic(neighbor), g + 1, neighbor, path + [state]))

    return None

# Example usage
start = [[1,2,3],[4,0,6],[7,5,8]]
solution = a_star(start)

# Print the solution path
for step in solution:
    for row in step:
        print(row)
    print("---")
