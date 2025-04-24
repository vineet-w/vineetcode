:: EXP10 – Route Tables Demo (Corrected)

route print
route print -4
route print -6
route -p add 192.168.69.69 mask 255.255.255.0 192.168.69.1
route change 192.168.69.69 mask 255.255.255.0 192.168.69.1
route -p add 192.168.69.69 mask 255.255.255.0 192.168.69.1 metric 1 if 14
route delete 192.168.69.69
