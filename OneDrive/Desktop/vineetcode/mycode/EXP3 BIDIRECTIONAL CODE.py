
from collections import deque

def bidirectional_search(graph, start, end):
    if start == end:
        return [start]

    start_queue = deque([start])
    end_queue = deque([end])
    start_visited = {start: None}
    end_visited = {end: None}

    while start_queue and end_queue:
        # Search from start side
        meet = search_one_side(graph, start_queue, start_visited, end_visited)
        if meet:
            return build_path(start_visited, end_visited, meet)

        # Search from end side
        meet = search_one_side(graph, end_queue, end_visited, start_visited)
        if meet:
            return build_path(start_visited, end_visited, meet)

    return None

def search_one_side(graph, queue, this_side, other_side):
    current = queue.popleft()
    for neighbor in graph.get(current, []):
        if neighbor not in this_side:
            this_side[neighbor] = current
            queue.append(neighbor)
            if neighbor in other_side:
                return neighbor
    return None

def build_path(from_start, from_end, meet):
    path = []
    node = meet
    while node:
        path.append(node)
        node = from_start[node]
    path.reverse()
    node = from_end[meet]
    while node:
        path.append(node)
        node = from_end[node]
    return path

# Example graph
graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F', 'G'],
    'D': ['B'],
    'E': ['B', 'H'],
    'F': ['C'],
    'G': ['C'],
    'H': ['E']
}

# Run the search
path = bidirectional_search(graph, 'A', 'H')
print("Shortest Path:", path)
