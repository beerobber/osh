#!/bin/bash

# Requires the AWS CLI and a valid AWS API key in default config or environment

# The full-texts S3 bucket, assumed to have one .txt file per hymn
S3_BUCKET=osh-ce-full-texts

aws s3 cp s3://${S3_BUCKET}/ db/texts/ --recursive;
