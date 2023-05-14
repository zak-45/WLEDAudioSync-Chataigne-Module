import socket
import struct
import sys
import argparse


def sendMulticastMessage(ip,port,group,msg):

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(0.5)
    sock.bind((ip,port))

    mgroup = socket.inet_aton(group)
    iface = socket.inet_aton(ip)
    
    sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP,  mgroup+iface)

    ttl_setting = 5;

    ttl = struct.pack('b', ttl_setting)
    sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, ttl)

    print(f"Sending phrase - {msg}", file=sys.stderr)
    _ = sock.sendto(msg.encode("utf8"), (group,port))
    print("Closing Socket", file=sys.stderr)


def main():
    # Take arguments from the command line
    parser = argparse.ArgumentParser()
    parser.add_argument("--ip", help="IP Address of the network interface", type=str, required=True)    
    parser.add_argument("--group", help="Multicast Group Address", type=str, required=True, default="239.0.0.1")
    parser.add_argument("--port", help="Multicast Port", type=int, required=True, default=11988)
    parser.add_argument("--msg", help="Message to Send", type=str, default="Hello Chataigne World")

    args = parser.parse_args()

    sendMulticastMessage(args.ip,args.port,args.group,args.msg);

if __name__ == "__main__":
    main()
