//EXP2 PROLOG CODE FOR FAMILY TREE
% Facts
male(john).
male(paul).
male(mike).
female(linda).
female(susan).
female(mary).

parent(john, paul).     % john is parent of paul
parent(john, susan).
parent(linda, paul).
parent(linda, susan).
parent(paul, mike).
parent(mary, mike).

% Rules
father(X, Y) :- male(X), parent(X, Y).
mother(X, Y) :- female(X), parent(X, Y).

sibling(X, Y) :- parent(Z, X), parent(Z, Y), X \= Y.

grandparent(X, Y) :- parent(X, Z), parent(Z, Y).

grandfather(X, Y) :- male(X), grandparent(X, Y).
grandmother(X, Y) :- female(X), grandparent(X, Y).


//queries :
grandfather(john, mike).