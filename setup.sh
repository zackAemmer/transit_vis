#!/bin/bash
sudo dd if=/dev/zero of=/swapfile bs=128M count=16
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
sudo swapon -s
sudo nano /etc/fstab
# add to newline at end: /swapfile swap swap defaults 0 0

wget -O miniconda.sh https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
chmod +x miniconda.sh
./miniconda.sh -b
export PATH=/home/ubuntu/miniconda3/bin:$PATH
conda update --yes conda
source $(conda info --root)/etc/profile.d/conda.sh

conda env create -q -n scrape-environment python=$PYTHON_VERSION --file scrape_environment.yml
conda activate scrape-environment
