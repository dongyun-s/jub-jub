package io.github.dongyuns.jubjub.common.performance;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class PerformanceLoggingAspect {

    @Around("@annotation(measuredOperation)")
    public Object measure(ProceedingJoinPoint joinPoint, MeasuredOperation measuredOperation) throws Throwable {
        long startedAt = System.nanoTime();
        String outcome = "success";

        try {
            return joinPoint.proceed();
        } catch (Throwable throwable) {
            outcome = "error";
            throw throwable;
        } finally {
            long elapsedMicros = (System.nanoTime() - startedAt) / 1_000;
            log.info("performance operation={} outcome={} elapsedMicros={}",
                    measuredOperation.value(), outcome, elapsedMicros);
        }
    }
}
