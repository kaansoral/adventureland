import sys

def clamp64BitInteger(prop, value):
    return max(0, min(sys.maxsize, value))