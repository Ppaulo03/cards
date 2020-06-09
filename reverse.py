
x = [['csac', '3', 0], ['df', '2', 0], ['sx', '1', 0]]
actual = x.pop(0)
x.append(actual)
x.reverse()
actual = x.pop(0)
x.append(actual)
actual = x.pop(0)
x.append(actual)
print(x)
